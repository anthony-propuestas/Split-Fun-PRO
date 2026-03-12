import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/react-app/context/AuthContext";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import AppLayout from "@/react-app/components/layout/AppLayout";

interface Member {
  id: number;
  name: string;
  user_id: string | null;
}

interface Group {
  id: number;
  name: string;
  emoji: string;
  members: Member[];
}

type SplitType = "equal" | "percentage" | "exact";

interface MemberSplit {
  member_id: number;
  name: string;
  included: boolean;
  amount: number;
  percentage: number;
}

export default function NewExpense() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const groupIdParam = searchParams.get("group");

  const [loadingGroups, setLoadingGroups] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(
    groupIdParam ? parseInt(groupIdParam) : null
  );
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidByMemberId, setPaidByMemberId] = useState<number | null>(null);
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [splits, setSplits] = useState<MemberSplit[]>([]);

  // Fetch groups with members in parallel
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch("/api/groups");
        if (!res.ok) return;
        
        const groupList = await res.json();
        
        // Fetch all members in parallel
        const groupsWithMembers = await Promise.all(
          groupList.map(async (g: { id: number; name: string; emoji: string }) => {
            const memberRes = await fetch(`/api/groups/${g.id}`);
            if (memberRes.ok) {
              const data = await memberRes.json();
              return { id: g.id, name: g.name, emoji: g.emoji, members: data.members || [] };
            }
            return { ...g, members: [] };
          })
        );
        
        setGroups(groupsWithMembers);
        
        // Auto-select and initialize
        const targetGroupId = groupIdParam ? parseInt(groupIdParam) : 
          (groupsWithMembers.length === 1 ? groupsWithMembers[0].id : null);
        
        if (targetGroupId) {
          const group = groupsWithMembers.find((g: Group) => g.id === targetGroupId);
          if (group) {
            initializeSplits(group);
          }
        }
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, [groupIdParam, user?.id]);

  const initializeSplits = (group: Group) => {
    setSelectedGroupId(group.id);
    const memberSplits = group.members.map((m) => ({
      member_id: m.id,
      name: m.name,
      included: true,
      amount: 0,
      percentage: 100 / group.members.length,
    }));
    setSplits(memberSplits);

    // Set current user as payer by default
    const currentUserMember = group.members.find((m) => m.user_id === user?.id);
    if (currentUserMember) {
      setPaidByMemberId(currentUserMember.id);
    } else if (group.members.length > 0) {
      setPaidByMemberId(group.members[0].id);
    }
  };

  const selectedGroup = useMemo(() => 
    groups.find((g) => g.id === selectedGroupId), 
    [groups, selectedGroupId]
  );

  // Calculate splits based on type
  const calculatedSplits = useMemo(() => {
    const totalAmount = parseFloat(amount) || 0;
    const includedMembers = splits.filter((s) => s.included);

    if (splitType === "equal" && includedMembers.length > 0) {
      const perPerson = totalAmount / includedMembers.length;
      return splits.map((s) => ({
        ...s,
        amount: s.included ? perPerson : 0,
        percentage: s.included ? 100 / includedMembers.length : 0,
      }));
    }
    return splits;
  }, [splits, amount, splitType]);

  const updateSplit = (memberId: number, field: keyof MemberSplit, value: number | boolean) => {
    setSplits((prev) =>
      prev.map((s) => (s.member_id === memberId ? { ...s, [field]: value } : s))
    );
  };

  const totalSplitAmount = splits.reduce((sum, s) => sum + (s.included ? s.amount : 0), 0);
  const totalPercentage = splits.reduce((sum, s) => sum + (s.included ? s.percentage : 0), 0);
  const amountNum = parseFloat(amount) || 0;

  const isValid =
    selectedGroupId &&
    description.trim() &&
    amountNum > 0 &&
    paidByMemberId &&
    splits.some((s) => s.included) &&
    (splitType === "equal" ||
      (splitType === "percentage" && Math.abs(totalPercentage - 100) < 0.01) ||
      (splitType === "exact" && Math.abs(totalSplitAmount - amountNum) < 0.01));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setSaving(true);
    try {
      const expenseSplits = calculatedSplits
        .filter((s) => s.included)
        .map((s) => ({
          member_id: s.member_id,
          amount: splitType === "exact" ? s.amount : (amountNum * s.percentage) / 100,
          percentage: s.percentage,
        }));

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: selectedGroupId,
          description,
          amount: amountNum,
          paid_by_member_id: paidByMemberId,
          split_type: splitType,
          splits: expenseSplits,
        }),
      });

      if (!res.ok) throw new Error("Failed to create expense");
      navigate(`/groups/${selectedGroupId}`);
    } catch (error) {
      console.error("Error creating expense:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to={selectedGroupId ? `/groups/${selectedGroupId}` : "/expenses"}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Gasto</h1>
        </div>

        {loadingGroups ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
            <p className="text-muted-foreground">Cargando grupos...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">Necesitas crear un grupo primero</p>
            <Link to="/groups/new">
              <Button className="bg-neon-cyan hover:bg-neon-cyan/90 text-black">
                Crear Grupo
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Group selector - only show if no group param and multiple groups */}
            {!groupIdParam && groups.length > 1 && (
              <div className="space-y-2">
                <Label>Grupo</Label>
                <div className="grid grid-cols-2 gap-2">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => initializeSplits(group)}
                      className={`p-3 rounded-xl text-left transition-all ${
                        selectedGroupId === group.id
                          ? "bg-neon-cyan/20 border-2 border-neon-cyan"
                          : "bg-card border border-border hover:border-neon-cyan/30"
                      }`}
                    >
                      <span className="text-lg mr-2">{group.emoji}</span>
                      <span className="font-medium text-foreground">{group.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Show selected group badge if from param */}
            {groupIdParam && selectedGroup && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border w-fit">
                <span className="text-lg">{selectedGroup.emoji}</span>
                <span className="font-medium text-foreground">{selectedGroup.name}</span>
              </div>
            )}

            {selectedGroup && (
              <>
                {/* Description & Amount */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ej: Cena, Supermercado..."
                      autoFocus
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-7"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Paid by */}
                <div className="space-y-2">
                  <Label>Pagado por</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedGroup.members.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setPaidByMemberId(member.id)}
                        className={`px-3 py-2 rounded-lg text-sm transition-all ${
                          paidByMemberId === member.id
                            ? "bg-neon-cyan text-black font-medium"
                            : "bg-secondary text-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {member.name}
                        {member.user_id === user?.id && " (Tú)"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Split type */}
                <div className="space-y-2">
                  <Label>Dividir</Label>
                  <div className="flex gap-2">
                    {[
                      { type: "equal" as SplitType, label: "Partes iguales" },
                      { type: "percentage" as SplitType, label: "Porcentajes" },
                      { type: "exact" as SplitType, label: "Montos exactos" },
                    ].map(({ type, label }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSplitType(type)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${
                          splitType === type
                            ? "bg-neon-purple/20 border-2 border-neon-purple text-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Member splits */}
                <div className="space-y-2">
                  <Label>Entre</Label>
                  <div className="space-y-2">
                    {splits.map((split) => (
                      <div
                        key={split.member_id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                          split.included ? "bg-card border border-border" : "bg-secondary/30"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => updateSplit(split.member_id, "included", !split.included)}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                            split.included
                              ? "bg-neon-cyan text-black"
                              : "border border-muted-foreground"
                          }`}
                        >
                          {split.included && <Check className="w-3 h-3" />}
                        </button>

                        <span
                          className={`flex-1 ${split.included ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {split.name}
                        </span>

                        {split.included && splitType === "equal" && amountNum > 0 && (
                          <span className="text-sm text-muted-foreground">
                            ${(amountNum / splits.filter((s) => s.included).length).toFixed(2)}
                          </span>
                        )}

                        {split.included && splitType === "percentage" && (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={split.percentage}
                              onChange={(e) =>
                                updateSplit(split.member_id, "percentage", parseFloat(e.target.value) || 0)
                              }
                              className="w-20 h-8 text-center"
                            />
                            <span className="text-muted-foreground">%</span>
                          </div>
                        )}

                        {split.included && splitType === "exact" && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">$</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={split.amount}
                              onChange={(e) =>
                                updateSplit(split.member_id, "amount", parseFloat(e.target.value) || 0)
                              }
                              className="w-24 h-8 text-center"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Validation feedback */}
                  {splitType === "percentage" && Math.abs(totalPercentage - 100) > 0.01 && (
                    <p className="text-sm text-red-400">
                      Los porcentajes deben sumar 100% (actual: {totalPercentage.toFixed(1)}%)
                    </p>
                  )}
                  {splitType === "exact" && amountNum > 0 && Math.abs(totalSplitAmount - amountNum) > 0.01 && (
                    <p className="text-sm text-red-400">
                      Los montos deben sumar ${amountNum.toFixed(2)} (actual: ${totalSplitAmount.toFixed(2)})
                    </p>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={saving || !isValid}
                  className="w-full bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium glow-cyan"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Gasto"
                  )}
                </Button>
              </>
            )}
          </form>
        )}
      </div>
    </AppLayout>
  );
}
