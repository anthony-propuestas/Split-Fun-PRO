import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";

type Env = any;

const app = new Hono<{ Bindings: Env }>();

// Generate a deterministic friend code based on user_id (6 chars, alphanumeric, uppercase)
// This ensures the same user gets the same friend code in dev and prod environments
function generateFriendCode(userId: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars like 0,O,1,I
  let code = "";
  
  // Create a simple hash from the userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Make hash positive
  hash = Math.abs(hash);
  
  // Generate 6 characters from the hash
  for (let i = 0; i < 6; i++) {
    code += chars.charAt((hash + i * 7) % chars.length);
    hash = Math.floor(hash / chars.length) + hash;
  }
  
  return code;
}

// OAuth redirect URL
app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });
  return c.json({ redirectUrl }, 200);
});

// Exchange code for session token
app.post("/api/sessions", async (c) => {
  const body = await c.req.json();
  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }
  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });
  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60,
  });
  return c.json({ success: true }, 200);
});

// Get current user (also ensures user has a profile with friend code)
app.get("/api/users/me", authMiddleware, async (c) => {
  const user = c.get("user")!;
  
  // Check if user already has a profile
  const existingProfile = await c.env.DB.prepare(`
    SELECT id, friend_code FROM user_profiles WHERE user_id = ?
  `).bind(user.id).first<{ id: number; friend_code: string }>();
  
  if (!existingProfile) {
    // Generate friend code and handle potential collisions
    let friendCode = generateFriendCode(user.id);
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      // Check if this code is already taken by another user
      const existingCode = await c.env.DB.prepare(`
        SELECT id FROM user_profiles WHERE friend_code = ?
      `).bind(friendCode).first();
      
      if (!existingCode) {
        // Code is available, create the profile
        await c.env.DB.prepare(`
          INSERT INTO user_profiles (user_id, friend_code, display_name)
          VALUES (?, ?, ?)
        `).bind(user.id, friendCode, user.google_user_data?.name || user.email?.split("@")[0] || "Usuario").run();
        break;
      }
      
      // Collision detected, generate a variation
      attempts++;
      friendCode = generateFriendCode(user.id + attempts.toString());
    }
  }
  // Don't update existing friend codes - once assigned, keep them stable
  
  return c.json(user);
});

// Logout
app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }
  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });
  return c.json({ success: true }, 200);
});

// ============ DASHBOARD API ============

app.get("/api/dashboard", authMiddleware, async (c) => {
  const user = c.get("user")!;

  // Get user's member IDs across all groups
  const { results: memberships } = await c.env.DB.prepare(`
    SELECT gm.id as member_id, gm.group_id, g.name as group_name, g.emoji
    FROM group_members gm
    JOIN groups g ON g.id = gm.group_id
    WHERE gm.user_id = ?
  `).bind(user.id).all<{ member_id: number; group_id: number; group_name: string; emoji: string }>();

  if (memberships.length === 0) {
    return c.json({ groups: [], totalOwed: 0, totalOwe: 0 });
  }

  const groupBalances = [];

  for (const membership of memberships) {
    // Calculate balance for this group
    // Positive = others owe user, Negative = user owes others
    
    // What user paid (others owe user their splits)
    const { results: userPaidExpenses } = await c.env.DB.prepare(`
      SELECT e.id, e.amount
      FROM expenses e
      WHERE e.group_id = ? AND e.paid_by_member_id = ?
    `).bind(membership.group_id, membership.member_id).all<{ id: number; amount: number }>();

    let othersOweUser = 0;
    for (const expense of userPaidExpenses) {
      // Sum splits that are NOT the user's own split
      const { results: otherSplits } = await c.env.DB.prepare(`
        SELECT SUM(amount) as total
        FROM expense_splits
        WHERE expense_id = ? AND member_id != ?
      `).bind(expense.id, membership.member_id).all<{ total: number | null }>();
      othersOweUser += otherSplits[0]?.total || 0;
    }

    // What user owes (user's splits on expenses paid by others)
    const { results: userOwes } = await c.env.DB.prepare(`
      SELECT SUM(es.amount) as total
      FROM expense_splits es
      JOIN expenses e ON e.id = es.expense_id
      WHERE e.group_id = ? AND es.member_id = ? AND e.paid_by_member_id != ?
    `).bind(membership.group_id, membership.member_id, membership.member_id).all<{ total: number | null }>();

    const userOwesAmount = userOwes[0]?.total || 0;

    // Settlements received (others paid user)
    const { results: settlementsReceived } = await c.env.DB.prepare(`
      SELECT SUM(amount) as total FROM settlements WHERE group_id = ? AND to_member_id = ?
    `).bind(membership.group_id, membership.member_id).all<{ total: number | null }>();
    const receivedAmount = settlementsReceived[0]?.total || 0;

    // Settlements made (user paid others)
    const { results: settlementsMade } = await c.env.DB.prepare(`
      SELECT SUM(amount) as total FROM settlements WHERE group_id = ? AND from_member_id = ?
    `).bind(membership.group_id, membership.member_id).all<{ total: number | null }>();
    const paidAmount = settlementsMade[0]?.total || 0;

    // Balance: what others owe - what user owes - received + paid
    // If user received settlements, reduce what others owe
    // If user made settlements, reduce what user owes
    const adjustedOthersOwe = othersOweUser - receivedAmount;
    const adjustedUserOwes = userOwesAmount - paidAmount;
    const balance = adjustedOthersOwe - adjustedUserOwes;

    groupBalances.push({
      id: membership.group_id,
      name: membership.group_name,
      emoji: membership.emoji,
      balance,
      owed: Math.max(0, adjustedOthersOwe),
      owes: Math.max(0, adjustedUserOwes),
    });
  }

  const totalOwed = groupBalances.reduce((sum, g) => sum + g.owed, 0);
  const totalOwe = groupBalances.reduce((sum, g) => sum + g.owes, 0);

  return c.json({ groups: groupBalances, totalOwed, totalOwe });
});

// ============ GROUPS API ============

// Get all groups for current user
app.get("/api/groups", authMiddleware, async (c) => {
  const user = c.get("user")!;
  
  const { results } = await c.env.DB.prepare(`
    SELECT g.*, 
           COUNT(DISTINCT gm.id) as member_count,
           (SELECT SUM(amount) FROM expenses WHERE group_id = g.id) as total_expenses
    FROM groups g
    LEFT JOIN group_members gm ON gm.group_id = g.id
    WHERE g.id IN (
      SELECT group_id FROM group_members WHERE user_id = ?
    )
    GROUP BY g.id
    ORDER BY g.updated_at DESC
  `).bind(user.id).all();

  // Calculate user balance per group
  const groupsWithBalance = await Promise.all(
    results.map(async (group: any) => {
      // Get user's member ID in this group
      const membership = await c.env.DB.prepare(`
        SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
      `).bind(group.id, user.id).first<{ id: number }>();

      if (!membership) {
        return { ...group, user_balance: 0 };
      }

      const memberId = membership.id;

      // What user paid (others owe user their splits)
      const { results: userPaidExpenses } = await c.env.DB.prepare(`
        SELECT id FROM expenses WHERE group_id = ? AND paid_by_member_id = ?
      `).bind(group.id, memberId).all<{ id: number }>();

      let othersOweUser = 0;
      for (const expense of userPaidExpenses) {
        const { results: otherSplits } = await c.env.DB.prepare(`
          SELECT SUM(amount) as total FROM expense_splits WHERE expense_id = ? AND member_id != ?
        `).bind(expense.id, memberId).all<{ total: number | null }>();
        othersOweUser += otherSplits[0]?.total || 0;
      }

      // What user owes (user's splits on expenses paid by others)
      const { results: userOwes } = await c.env.DB.prepare(`
        SELECT SUM(es.amount) as total
        FROM expense_splits es
        JOIN expenses e ON e.id = es.expense_id
        WHERE e.group_id = ? AND es.member_id = ? AND e.paid_by_member_id != ?
      `).bind(group.id, memberId, memberId).all<{ total: number | null }>();

      const userOwesAmount = userOwes[0]?.total || 0;

      // Settlements received (others paid user)
      const { results: settlementsReceived } = await c.env.DB.prepare(`
        SELECT SUM(amount) as total FROM settlements WHERE group_id = ? AND to_member_id = ?
      `).bind(group.id, memberId).all<{ total: number | null }>();
      const receivedAmount = settlementsReceived[0]?.total || 0;

      // Settlements made (user paid others)
      const { results: settlementsMade } = await c.env.DB.prepare(`
        SELECT SUM(amount) as total FROM settlements WHERE group_id = ? AND from_member_id = ?
      `).bind(group.id, memberId).all<{ total: number | null }>();
      const paidAmount = settlementsMade[0]?.total || 0;

      // Adjusted balance accounting for settlements
      const adjustedOthersOwe = othersOweUser - receivedAmount;
      const adjustedUserOwes = userOwesAmount - paidAmount;
      const userBalance = adjustedOthersOwe - adjustedUserOwes;

      return { ...group, user_balance: userBalance };
    })
  );

  return c.json(groupsWithBalance);
});

// Create new group
app.post("/api/groups", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json();
  
  if (!body.name) {
    return c.json({ error: "Group name is required" }, 400);
  }

  // Create group
  const groupResult = await c.env.DB.prepare(`
    INSERT INTO groups (name, emoji, description, created_by)
    VALUES (?, ?, ?, ?)
  `).bind(
    body.name,
    body.emoji || "💰",
    body.description || null,
    user.id
  ).run();

  const groupId = groupResult.meta.last_row_id;

  // Add creator as first member
  await c.env.DB.prepare(`
    INSERT INTO group_members (group_id, user_id, name, email, is_registered)
    VALUES (?, ?, ?, ?, 1)
  `).bind(
    groupId,
    user.id,
    user.google_user_data?.name || user.email,
    user.email
  ).run();

  return c.json({ id: groupId, success: true }, 201);
});

// Get group balances (who owes whom)
app.get("/api/groups/:id/balances", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const groupId = c.req.param("id");

  // Check if user is member
  const membership = await c.env.DB.prepare(`
    SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
  `).bind(groupId, user.id).first();

  if (!membership) {
    return c.json({ error: "Not a member of this group" }, 403);
  }

  // Get all members
  const { results: members } = await c.env.DB.prepare(`
    SELECT id, name FROM group_members WHERE group_id = ?
  `).bind(groupId).all<{ id: number; name: string }>();

  // Get all expenses with splits for this group
  const { results: expenses } = await c.env.DB.prepare(`
    SELECT e.id, e.amount, e.paid_by_member_id, e.description
    FROM expenses e
    WHERE e.group_id = ?
  `).bind(groupId).all<{ id: number; amount: number; paid_by_member_id: number; description: string }>();

  // Build a debt matrix: debts[debtor][creditor] = amount debtor owes creditor
  const debts: Record<number, Record<number, number>> = {};
  for (const member of members) {
    debts[member.id] = {};
    for (const other of members) {
      debts[member.id][other.id] = 0;
    }
  }

  // Process each expense
  for (const expense of expenses) {
    const payerId = expense.paid_by_member_id;
    
    // Get splits for this expense
    const { results: splits } = await c.env.DB.prepare(`
      SELECT member_id, amount FROM expense_splits WHERE expense_id = ?
    `).bind(expense.id).all<{ member_id: number; amount: number }>();

    // Each person who didn't pay owes the payer their share
    for (const split of splits) {
      if (split.member_id !== payerId) {
        debts[split.member_id][payerId] += split.amount;
      }
    }
  }

  // Apply settlements (reduce debts)
  const { results: settlements_data } = await c.env.DB.prepare(`
    SELECT from_member_id, to_member_id, amount FROM settlements WHERE group_id = ?
  `).bind(groupId).all<{ from_member_id: number; to_member_id: number; amount: number }>();

  for (const settlement of settlements_data) {
    // Settlement means from_member paid to_member, reducing from_member's debt
    if (debts[settlement.from_member_id] && debts[settlement.from_member_id][settlement.to_member_id] !== undefined) {
      debts[settlement.from_member_id][settlement.to_member_id] -= settlement.amount;
    }
  }

  // Simplify debts: net out mutual debts
  const settlements: { from: number; fromName: string; to: number; toName: string; amount: number }[] = [];
  const processed = new Set<string>();

  for (const member of members) {
    for (const other of members) {
      if (member.id >= other.id) continue;
      const key = `${member.id}-${other.id}`;
      if (processed.has(key)) continue;
      processed.add(key);

      const aOwesB = debts[member.id][other.id] || 0;
      const bOwesA = debts[other.id][member.id] || 0;
      const net = aOwesB - bOwesA;

      if (Math.abs(net) > 0.01) {
        if (net > 0) {
          // member owes other
          settlements.push({
            from: member.id,
            fromName: member.name,
            to: other.id,
            toName: other.name,
            amount: net
          });
        } else {
          // other owes member
          settlements.push({
            from: other.id,
            fromName: other.name,
            to: member.id,
            toName: member.name,
            amount: -net
          });
        }
      }
    }
  }

  // Sort by amount descending
  settlements.sort((a, b) => b.amount - a.amount);

  // Calculate individual balances (positive = owed money, negative = owes money)
  const memberBalances: { id: number; name: string; balance: number }[] = [];
  for (const member of members) {
    let balance = 0;
    for (const other of members) {
      balance += debts[other.id][member.id] || 0; // others owe me
      balance -= debts[member.id][other.id] || 0; // I owe others
    }
    memberBalances.push({ id: member.id, name: member.name, balance });
  }

  return c.json({ settlements, memberBalances });
});

// Get single group with members
app.get("/api/groups/:id", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const groupId = c.req.param("id");

  // Check if user is member
  const membership = await c.env.DB.prepare(`
    SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
  `).bind(groupId, user.id).first();

  if (!membership) {
    return c.json({ error: "Not a member of this group" }, 403);
  }

  const group = await c.env.DB.prepare(`
    SELECT * FROM groups WHERE id = ?
  `).bind(groupId).first();

  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  const { results: members } = await c.env.DB.prepare(`
    SELECT * FROM group_members WHERE group_id = ? ORDER BY created_at ASC
  `).bind(groupId).all();

  return c.json({ ...group, members });
});

// Add member to group
app.post("/api/groups/:id/members", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const groupId = c.req.param("id");
  const body = await c.req.json();

  // Check if user is member
  const membership = await c.env.DB.prepare(`
    SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
  `).bind(groupId, user.id).first();

  if (!membership) {
    return c.json({ error: "Not a member of this group" }, 403);
  }

  if (!body.name) {
    return c.json({ error: "Member name is required" }, 400);
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO group_members (group_id, user_id, name, email, is_registered)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    groupId,
    body.user_id || null,
    body.name,
    body.email || null,
    body.user_id ? 1 : 0
  ).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

// Delete member from group
app.delete("/api/groups/:id/members/:memberId", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const groupId = c.req.param("id");
  const memberId = c.req.param("memberId");

  // Check if user is member
  const membership = await c.env.DB.prepare(`
    SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
  `).bind(groupId, user.id).first();

  if (!membership) {
    return c.json({ error: "Not a member of this group" }, 403);
  }

  await c.env.DB.prepare(`
    DELETE FROM group_members WHERE id = ? AND group_id = ?
  `).bind(memberId, groupId).run();

  return c.json({ success: true });
});

// Update group
app.patch("/api/groups/:id", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const groupId = c.req.param("id");
  const body = await c.req.json();

  // Check if user is member
  const membership = await c.env.DB.prepare(`
    SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
  `).bind(groupId, user.id).first();

  if (!membership) {
    return c.json({ error: "Not a member of this group" }, 403);
  }

  await c.env.DB.prepare(`
    UPDATE groups SET name = ?, emoji = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    body.name,
    body.emoji || "💰",
    body.description || null,
    groupId
  ).run();

  return c.json({ success: true });
});

// Delete group
app.delete("/api/groups/:id", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const groupId = c.req.param("id");

  // Check if user is creator
  const group = await c.env.DB.prepare(`
    SELECT created_by FROM groups WHERE id = ?
  `).bind(groupId).first<{ created_by: string }>();

  if (!group || group.created_by !== user.id) {
    return c.json({ error: "Only the creator can delete the group" }, 403);
  }

  // Delete all related data
  await c.env.DB.prepare(`DELETE FROM expense_splits WHERE expense_id IN (SELECT id FROM expenses WHERE group_id = ?)`).bind(groupId).run();
  await c.env.DB.prepare(`DELETE FROM expenses WHERE group_id = ?`).bind(groupId).run();
  await c.env.DB.prepare(`DELETE FROM group_members WHERE group_id = ?`).bind(groupId).run();
  await c.env.DB.prepare(`DELETE FROM groups WHERE id = ?`).bind(groupId).run();

  return c.json({ success: true });
});

// ============ USER PROFILE API ============

// Get or create user profile
app.get("/api/profile", authMiddleware, async (c) => {
  const user = c.get("user")!;

  let profile = await c.env.DB.prepare(`
    SELECT * FROM user_profiles WHERE user_id = ?
  `).bind(user.id).first<{ id: number; friend_code: string; display_name: string }>();

  if (!profile) {
    // Generate friend code and handle potential collisions
    let friendCode = generateFriendCode(user.id);
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      // Check if this code is already taken by another user
      const existingCode = await c.env.DB.prepare(`
        SELECT id FROM user_profiles WHERE friend_code = ?
      `).bind(friendCode).first();
      
      if (!existingCode) {
        // Code is available, create the profile
        await c.env.DB.prepare(`
          INSERT INTO user_profiles (user_id, friend_code, display_name)
          VALUES (?, ?, ?)
        `).bind(user.id, friendCode, user.google_user_data?.name || user.email?.split("@")[0] || "Usuario").run();
        break;
      }
      
      // Collision detected, generate a variation
      attempts++;
      friendCode = generateFriendCode(user.id + attempts.toString());
    }

    profile = await c.env.DB.prepare(`
      SELECT * FROM user_profiles WHERE user_id = ?
    `).bind(user.id).first<{ id: number; friend_code: string; display_name: string }>();
  }
  // Don't update existing friend codes - once assigned, keep them stable

  return c.json({ ...profile, email: user.email });
});

// Update display name
app.patch("/api/profile", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json();

  if (body.display_name) {
    await c.env.DB.prepare(`
      UPDATE user_profiles SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
    `).bind(body.display_name, user.id).run();
  }

  return c.json({ success: true });
});

// Search user by friend code or email
app.get("/api/users/search", authMiddleware, async (c) => {
  const query = c.req.query("q")?.trim().toUpperCase();
  if (!query || query.length < 3) {
    return c.json({ error: "Search query too short" }, 400);
  }

  // Search by friend code (exact match)
  const byCode = await c.env.DB.prepare(`
    SELECT up.user_id, up.friend_code, up.display_name
    FROM user_profiles up
    WHERE up.friend_code = ?
  `).bind(query).first();

  if (byCode) {
    return c.json({ user: byCode });
  }

  // Search by email (case insensitive, handled via Mocha user lookup)
  // For now, we return not found - email lookup would require accessing the user service
  return c.json({ user: null });
});

// ============ EXPENSES API ============

// Get all expenses for current user
app.get("/api/expenses", authMiddleware, async (c) => {
  const user = c.get("user")!;

  const { results } = await c.env.DB.prepare(`
    SELECT e.*, g.name as group_name, g.emoji as group_emoji,
           pm.name as paid_by_name, pm.user_id as paid_by_user_id,
           (SELECT amount FROM expense_splits WHERE expense_id = e.id AND member_id = (
             SELECT id FROM group_members WHERE group_id = e.group_id AND user_id = ?
           )) as your_share
    FROM expenses e
    JOIN groups g ON g.id = e.group_id
    JOIN group_members pm ON pm.id = e.paid_by_member_id
    WHERE e.group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)
    ORDER BY e.created_at DESC
  `).bind(user.id, user.id).all();

  return c.json(results);
});

// Get expenses for a specific group
app.get("/api/groups/:id/expenses", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const groupId = c.req.param("id");

  const membership = await c.env.DB.prepare(`
    SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
  `).bind(groupId, user.id).first();

  if (!membership) {
    return c.json({ error: "Not a member of this group" }, 403);
  }

  const { results } = await c.env.DB.prepare(`
    SELECT e.*, pm.name as paid_by_name,
           (SELECT amount FROM expense_splits WHERE expense_id = e.id AND member_id = ?) as your_share
    FROM expenses e
    JOIN group_members pm ON pm.id = e.paid_by_member_id
    WHERE e.group_id = ?
    ORDER BY e.created_at DESC
  `).bind(membership.id, groupId).all();

  return c.json(results);
});

// Create expense with splits
app.post("/api/expenses", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json();

  if (!body.group_id || !body.description || !body.amount || !body.paid_by_member_id || !body.splits) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  // Verify user is member of group
  const membership = await c.env.DB.prepare(`
    SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
  `).bind(body.group_id, user.id).first();

  if (!membership) {
    return c.json({ error: "Not a member of this group" }, 403);
  }

  // Create expense
  const expenseResult = await c.env.DB.prepare(`
    INSERT INTO expenses (group_id, description, amount, paid_by_member_id, split_type, expense_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    body.group_id,
    body.description,
    body.amount,
    body.paid_by_member_id,
    body.split_type || "equal",
    body.expense_date || null,
    user.id
  ).run();

  const expenseId = expenseResult.meta.last_row_id;

  // Create splits
  for (const split of body.splits) {
    await c.env.DB.prepare(`
      INSERT INTO expense_splits (expense_id, member_id, amount, percentage)
      VALUES (?, ?, ?, ?)
    `).bind(
      expenseId,
      split.member_id,
      split.amount,
      split.percentage || null
    ).run();
  }

  // Update group timestamp
  await c.env.DB.prepare(`
    UPDATE groups SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(body.group_id).run();

  return c.json({ id: expenseId, success: true }, 201);
});

// Delete expense
app.delete("/api/expenses/:id", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const expenseId = c.req.param("id");

  const expense = await c.env.DB.prepare(`
    SELECT created_by FROM expenses WHERE id = ?
  `).bind(expenseId).first<{ created_by: string }>();

  if (!expense || expense.created_by !== user.id) {
    return c.json({ error: "Cannot delete this expense" }, 403);
  }

  await c.env.DB.prepare(`DELETE FROM expense_splits WHERE expense_id = ?`).bind(expenseId).run();
  await c.env.DB.prepare(`DELETE FROM expenses WHERE id = ?`).bind(expenseId).run();

  return c.json({ success: true });
});

// Get settlements for a group
app.get("/api/groups/:id/settlements", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const groupId = c.req.param("id");

  // Check if user is member
  const membership = await c.env.DB.prepare(`
    SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
  `).bind(groupId, user.id).first();

  if (!membership) {
    return c.json({ error: "Not a member of this group" }, 403);
  }

  const { results: settlements } = await c.env.DB.prepare(`
    SELECT s.*, 
      fm.name as from_name,
      tm.name as to_name
    FROM settlements s
    JOIN group_members fm ON s.from_member_id = fm.id
    JOIN group_members tm ON s.to_member_id = tm.id
    WHERE s.group_id = ?
    ORDER BY s.created_at DESC
  `).bind(groupId).all();

  return c.json(settlements);
});

// Create settlement (record a payment)
app.post("/api/settlements", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json();

  if (!body.group_id || !body.from_member_id || !body.to_member_id || !body.amount) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  if (body.amount <= 0) {
    return c.json({ error: "Amount must be positive" }, 400);
  }

  // Check if user is member
  const membership = await c.env.DB.prepare(`
    SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
  `).bind(body.group_id, user.id).first();

  if (!membership) {
    return c.json({ error: "Not a member of this group" }, 403);
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO settlements (group_id, from_member_id, to_member_id, amount, note, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    body.group_id,
    body.from_member_id,
    body.to_member_id,
    body.amount,
    body.note || null,
    user.id
  ).run();

  // Update group timestamp
  await c.env.DB.prepare(`
    UPDATE groups SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(body.group_id).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

// Get pending debts for user across all groups (for quick settle)
app.get("/api/my-debts", authMiddleware, async (c) => {
  const user = c.get("user")!;

  // Get all groups the user is in
  const { results: memberships } = await c.env.DB.prepare(`
    SELECT gm.id as member_id, gm.group_id, g.name as group_name, g.emoji
    FROM group_members gm
    JOIN groups g ON gm.group_id = g.id
    WHERE gm.user_id = ?
  `).bind(user.id).all<{ member_id: number; group_id: number; group_name: string; emoji: string }>();

  const debts: { 
    groupId: number; 
    groupName: string; 
    emoji: string;
    myMemberId: number;
    toMemberId: number; 
    toMemberName: string; 
    amount: number 
  }[] = [];

  for (const membership of memberships) {
    // Calculate what user owes in this group
    const { results: expenses } = await c.env.DB.prepare(`
      SELECT e.id, e.paid_by_member_id
      FROM expenses e
      WHERE e.group_id = ?
    `).bind(membership.group_id).all<{ id: number; paid_by_member_id: number }>();

    const owes: Record<number, number> = {};

    for (const expense of expenses) {
      if (expense.paid_by_member_id === membership.member_id) continue;
      
      const split = await c.env.DB.prepare(`
        SELECT amount FROM expense_splits WHERE expense_id = ? AND member_id = ?
      `).bind(expense.id, membership.member_id).first<{ amount: number }>();

      if (split) {
        owes[expense.paid_by_member_id] = (owes[expense.paid_by_member_id] || 0) + split.amount;
      }
    }

    // Subtract settlements
    const { results: settlements } = await c.env.DB.prepare(`
      SELECT to_member_id, amount FROM settlements 
      WHERE group_id = ? AND from_member_id = ?
    `).bind(membership.group_id, membership.member_id).all<{ to_member_id: number; amount: number }>();

    for (const s of settlements) {
      owes[s.to_member_id] = (owes[s.to_member_id] || 0) - s.amount;
    }

    // Get member names and add to debts list
    for (const [toId, amount] of Object.entries(owes)) {
      if (amount > 0.01) {
        const member = await c.env.DB.prepare(`
          SELECT name FROM group_members WHERE id = ?
        `).bind(toId).first<{ name: string }>();

        debts.push({
          groupId: membership.group_id,
          groupName: membership.group_name,
          emoji: membership.emoji,
          myMemberId: membership.member_id,
          toMemberId: Number(toId),
          toMemberName: member?.name || "Desconocido",
          amount
        });
      }
    }
  }

  return c.json(debts);
});

// ============ PAYMENT REMINDERS API (Don Barriga) ============

// Send a payment reminder
app.post("/api/payment-reminders", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json();

  if (!body.group_id || !body.to_member_id || !body.amount) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  // Get the from_member_id for the current user in this group
  const fromMember = await c.env.DB.prepare(`
    SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
  `).bind(body.group_id, user.id).first<{ id: number }>();

  if (!fromMember) {
    return c.json({ error: "Not a member of this group" }, 403);
  }

  // Get the to_member's user_id if they are registered
  const toMember = await c.env.DB.prepare(`
    SELECT user_id FROM group_members WHERE id = ?
  `).bind(body.to_member_id).first<{ user_id: string | null }>();

  const result = await c.env.DB.prepare(`
    INSERT INTO payment_reminders (group_id, from_member_id, to_member_id, from_user_id, to_user_id, amount, meme_url, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    body.group_id,
    fromMember.id,
    body.to_member_id,
    user.id,
    toMember?.user_id || null,
    body.amount,
    body.meme_url || "https://019c8165-c866-7049-81dc-366b06644ca0.mochausercontent.com/meme.jpg",
    body.message || "¡Te vine a cobrar la renta!"
  ).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

// Get payment reminders for current user (where they are the debtor)
app.get("/api/payment-reminders", authMiddleware, async (c) => {
  const user = c.get("user")!;

  const { results } = await c.env.DB.prepare(`
    SELECT pr.*, 
           g.name as group_name, g.emoji as group_emoji,
           fm.name as from_member_name,
           tm.name as to_member_name
    FROM payment_reminders pr
    JOIN groups g ON g.id = pr.group_id
    JOIN group_members fm ON fm.id = pr.from_member_id
    JOIN group_members tm ON tm.id = pr.to_member_id
    WHERE pr.to_user_id = ?
    ORDER BY pr.created_at DESC
  `).bind(user.id).all();

  return c.json(results);
});

// Get count of unseen reminders
app.get("/api/payment-reminders/count", authMiddleware, async (c) => {
  const user = c.get("user")!;

  const result = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM payment_reminders WHERE to_user_id = ? AND is_seen = 0
  `).bind(user.id).first<{ count: number }>();

  return c.json({ count: result?.count || 0 });
});

// Mark reminder as seen
app.patch("/api/payment-reminders/:id/seen", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const reminderId = c.req.param("id");

  await c.env.DB.prepare(`
    UPDATE payment_reminders SET is_seen = 1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND to_user_id = ?
  `).bind(reminderId, user.id).run();

  return c.json({ success: true });
});

// ============== ACHIEVEMENTS ==============

// Achievement definitions
const ACHIEVEMENTS = [
  {
    key: "first_group",
    title: "Primer Grupo",
    description: "Crea tu primer grupo de gastos",
    icon: "👥",
    check: "groups",
  },
  {
    key: "first_expense",
    title: "Primer Gasto",
    description: "Registra tu primer gasto compartido",
    icon: "💸",
    check: "expenses",
  },
  {
    key: "debt_collector",
    title: "Don Barriga",
    description: "Envía tu primer recordatorio de pago",
    icon: "🔔",
    check: "reminders_sent",
  },
  {
    key: "social",
    title: "Sociable",
    description: "Agrega un miembro a un grupo",
    icon: "🤝",
    check: "members_added",
  },
  {
    key: "debt_settled",
    title: "Cuentas Claras",
    description: "Salda una deuda con alguien",
    icon: "✅",
    check: "settlements",
  },
];

// Get achievements with unlock status
app.get("/api/achievements", authMiddleware, async (c) => {
  const user = c.get("user")!;

  // Get user's unlocked achievements
  const unlocked = await c.env.DB.prepare(`
    SELECT achievement_key, unlocked_at FROM user_achievements WHERE user_id = ?
  `).bind(user.id).all<{ achievement_key: string; unlocked_at: string }>();

  const unlockedMap = new Map(
    unlocked.results.map((a: any) => [a.achievement_key, a.unlocked_at])
  );

  // Build response with unlock status
  const achievements = ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: unlockedMap.has(a.key),
    unlocked_at: unlockedMap.get(a.key) || null,
  }));

  const totalUnlocked = achievements.filter((a) => a.unlocked).length;

  return c.json({
    achievements,
    total: ACHIEVEMENTS.length,
    unlocked: totalUnlocked,
  });
});

// Check and award new achievements
app.post("/api/achievements/check", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const newlyUnlocked: string[] = [];

  // Get already unlocked achievements
  const existing = await c.env.DB.prepare(`
    SELECT achievement_key FROM user_achievements WHERE user_id = ?
  `).bind(user.id).all<{ achievement_key: string }>();
  
  const alreadyUnlocked = new Set(existing.results.map((a: any) => a.achievement_key));

  // Check each achievement
  for (const achievement of ACHIEVEMENTS) {
    if (alreadyUnlocked.has(achievement.key)) continue;

    let earned = false;

    switch (achievement.check) {
      case "groups": {
        const result = await c.env.DB.prepare(`
          SELECT COUNT(*) as count FROM groups WHERE created_by = ?
        `).bind(user.id).first<{ count: number }>();
        earned = (result?.count || 0) >= 1;
        break;
      }
      case "expenses": {
        const result = await c.env.DB.prepare(`
          SELECT COUNT(*) as count FROM expenses WHERE created_by = ?
        `).bind(user.id).first<{ count: number }>();
        earned = (result?.count || 0) >= 1;
        break;
      }
      case "reminders_sent": {
        const result = await c.env.DB.prepare(`
          SELECT COUNT(*) as count FROM payment_reminders WHERE from_user_id = ?
        `).bind(user.id).first<{ count: number }>();
        earned = (result?.count || 0) >= 1;
        break;
      }
      case "members_added": {
        // Check if user has added at least 2 members to any group they created
        // (1 member is auto-added as the creator)
        const result = await c.env.DB.prepare(`
          SELECT COUNT(*) as count FROM group_members gm
          JOIN groups g ON gm.group_id = g.id
          WHERE g.created_by = ?
        `).bind(user.id).first<{ count: number }>();
        earned = (result?.count || 0) >= 2;
        break;
      }
      case "settlements": {
        const result = await c.env.DB.prepare(`
          SELECT COUNT(*) as count FROM settlements WHERE created_by = ?
        `).bind(user.id).first<{ count: number }>();
        earned = (result?.count || 0) >= 1;
        break;
      }
    }

    if (earned) {
      await c.env.DB.prepare(`
        INSERT INTO user_achievements (user_id, achievement_key, unlocked_at, created_at, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(user.id, achievement.key).run();
      newlyUnlocked.push(achievement.key);
    }
  }

  return c.json({ newlyUnlocked });
});

export default {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async fetch(request: any, env: Env, ctx: any): Promise<any> {
    const url = new URL(request.url);
    // Route /api/* requests through the Hono app
    if (url.pathname.startsWith("/api/")) {
      return app.fetch(request, env, ctx);
    }
    // For all other routes, serve the React SPA static assets
    // This is required in Pages Advanced Mode (env.ASSETS is the Pages static binding)
    return env.ASSETS.fetch(request);
  },
};
