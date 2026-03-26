import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Plus, UserPlus, Trash2, Receipt, X, Search, ArrowRight, Wallet, Users, Bell, ImagePlus } from "lucide-react";
import { useAuth } from "@/react-app/context/AuthContext";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/react-app/components/ui/dialog";
import AppLayout from "@/react-app/components/layout/AppLayout";

interface Member {
  id: number;
  name: string;
  email: string | null;
  user_id: string | null;
  is_registered: number;
}

interface Group {
  id: number;
  name: string;
  emoji: string;
  description: string | null;
  created_by: string;
  members: Member[];
}

interface FoundUser {
  user_id: string;
  friend_code: string;
  display_name: string;
}

interface Settlement {
  from: number;
  fromName: string;
  to: number;
  toName: string;
  amount: number;
}

interface MemberBalance {
  id: number;
  name: string;
  balance: number;
}

interface BalancesData {
  settlements: Settlement[];
  memberBalances: MemberBalance[];
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  paid_by_name: string;
  paid_by_member_id: number;
  your_share: number | null;
  expense_date: string | null;
  created_at: string;
}

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [viewMembersOpen, setViewMembersOpen] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [searchError, setSearchError] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  
  // Manual add state (for unregistered members)
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualName, setManualName] = useState("");
  
  // Balances state
  const [balances, setBalances] = useState<BalancesData | null>(null);
  
  // Expenses state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Settle dialog state
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [settling, setSettling] = useState(false);
  
  // Payment reminder state
  const [sendingReminder, setSendingReminder] = useState<number | null>(null);
  const [sentReminders, setSentReminders] = useState<Set<number>>(new Set());
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderSettlement, setReminderSettlement] = useState<Settlement | null>(null);
  const [reminderImageFile, setReminderImageFile] = useState<File | null>(null);
  const [reminderImagePreview, setReminderImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${id}`);
      if (!res.ok) throw new Error("Failed to fetch group");
      const data = await res.json();
      setGroup(data);
    } catch (error) {
      console.error("Error fetching group:", error);
      navigate("/groups");
    } finally {
      setLoading(false);
    }
  };

  const fetchBalances = async () => {
    try {
      const res = await fetch(`/api/groups/${id}/balances`);
      if (res.ok) {
        const data = await res.json();
        setBalances(data);
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`/api/groups/${id}/expenses`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const openSettleDialog = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setSettleAmount(settlement.amount.toFixed(2));
    setSettleDialogOpen(true);
  };

  const handleSettle = async () => {
    if (!selectedSettlement || !settleAmount || !id) return;
    
    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    setSettling(true);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: parseInt(id),
          from_member_id: selectedSettlement.from,
          to_member_id: selectedSettlement.to,
          amount,
        }),
      });
      
      if (res.ok) {
        setSettleDialogOpen(false);
        setSelectedSettlement(null);
        setSettleAmount("");
        fetchBalances();
      }
    } catch (error) {
      console.error("Error settling debt:", error);
    } finally {
      setSettling(false);
    }
  };

  useEffect(() => {
    fetchGroup();
    fetchBalances();
    fetchExpenses();
  }, [id]);

  const searchUser = async () => {
    const query = searchQuery.trim();
    if (query.length !== 6) {
      setSearchError("El código debe tener 6 caracteres");
      return;
    }

    setSearching(true);
    setFoundUser(null);
    setSearchError("");

    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.user) {
        const alreadyMember = group?.members.some(m => m.user_id === data.user.user_id);
        if (alreadyMember) {
          setSearchError("Este usuario ya es miembro del grupo");
        } else if (data.user.user_id === user?.id) {
          setSearchError("No puedes añadirte a ti mismo");
        } else {
          setFoundUser(data.user);
        }
      } else {
        setSearchError("No se encontró ningún usuario con ese código");
      }
    } catch (error) {
      console.error("Error searching user:", error);
      setSearchError("Error al buscar usuario");
    } finally {
      setSearching(false);
    }
  };

  const addFoundUser = async () => {
    if (!foundUser) return;
    setAddingMember(true);
    try {
      const res = await fetch(`/api/groups/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: foundUser.display_name,
          user_id: foundUser.user_id,
        }),
      });
      if (!res.ok) throw new Error("Failed to add member");
      setSearchQuery("");
      setFoundUser(null);
      setAddMemberOpen(false);
      fetchGroup();
    } catch (error) {
      console.error("Error adding member:", error);
    } finally {
      setAddingMember(false);
    }
  };

  const removeMember = async (memberId: number) => {
    if (!confirm("¿Eliminar este miembro del grupo?")) return;
    try {
      await fetch(`/api/groups/${id}/members/${memberId}`, { method: "DELETE" });
      fetchGroup();
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const deleteGroup = async () => {
    if (!confirm("¿Eliminar este grupo? Se eliminarán todos los gastos asociados.")) return;
    try {
      await fetch(`/api/groups/${id}`, { method: "DELETE" });
      navigate("/groups");
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  };

  const resetSearch = () => {
    setSearchQuery("");
    setFoundUser(null);
    setSearchError("");
    setShowManualAdd(false);
    setManualName("");
  };

  const addManualMember = async () => {
    const name = manualName.trim();
    if (!name) return;
    
    const alreadyExists = group?.members.some(
      m => m.name.toLowerCase() === name.toLowerCase()
    );
    if (alreadyExists) {
      setSearchError("Ya existe un miembro con ese nombre");
      return;
    }

    setAddingMember(true);
    try {
      const res = await fetch(`/api/groups/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to add member");
      setManualName("");
      setShowManualAdd(false);
      setAddMemberOpen(false);
      fetchGroup();
    } catch (error) {
      console.error("Error adding member:", error);
    } finally {
      setAddingMember(false);
    }
  };

  const openReminderDialog = (settlement: Settlement) => {
    const debtorMember = group?.members.find(m => m.id === settlement.from);
    if (!debtorMember || !debtorMember.user_id) {
      alert("Solo puedes enviar recordatorios a usuarios registrados");
      return;
    }
    setReminderSettlement(settlement);
    setReminderImageFile(null);
    setReminderImagePreview(null);
    setReminderDialogOpen(true);
  };

  const handleReminderImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReminderImageFile(file);
    setReminderImagePreview(URL.createObjectURL(file));
  };

  const sendPaymentReminder = async () => {
    if (!reminderSettlement) return;
    setSendingReminder(reminderSettlement.from);
    try {
      let memeUrl: string | undefined;

      if (reminderImageFile) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append("image", reminderImageFile);
        const uploadRes = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });
        setUploadingImage(false);
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          memeUrl = uploadData.url;
        }
      }

      const body: Record<string, unknown> = {
        group_id: Number(id),
        to_member_id: reminderSettlement.from,
        amount: reminderSettlement.amount,
      };
      if (memeUrl) body.meme_url = memeUrl;

      const res = await fetch("/api/payment-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to send reminder");
      setSentReminders(prev => new Set(prev).add(reminderSettlement.from));
      setReminderDialogOpen(false);
    } catch (error) {
      console.error("Error sending payment reminder:", error);
      alert("Error al enviar el recordatorio");
    } finally {
      setSendingReminder(null);
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-iridescent-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!group) return null;

  const isCreator = group.created_by === user?.id;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/groups">
              <Button variant="ghost" size="icon" className="hover:bg-white/5">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{group.emoji}</span>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
                {group.description && (
                  <p className="text-muted-foreground">{group.description}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {isCreator && (
              <Button variant="outline" size="icon" onClick={deleteGroup} className="text-red-400 border-white/10 bg-white/5 hover:bg-red-400/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Link to={`/expenses/new?group=${id}`} className="flex-1 min-w-[200px]">
            <Button className="w-full btn-iridescent glow-iridescent">
              <Plus className="w-4 h-4 mr-2" />
              Añadir Gasto
            </Button>
          </Link>
          
          {/* View Members Button */}
          <Dialog open={viewMembersOpen} onOpenChange={setViewMembersOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">
                <Users className="w-4 h-4 mr-2" />
                Miembros ({group.members.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/20 max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-iridescent-blue" />
                  Miembros actuales
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2 pt-2 max-h-[60vh] overflow-y-auto">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-iridescent-green/30 via-iridescent-blue/30 to-iridescent-pink/30 flex items-center justify-center text-sm font-medium text-foreground">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {member.name}
                          {member.user_id === user?.id && (
                            <span className="ml-2 text-xs text-iridescent-blue">(Tú)</span>
                          )}
                        </p>
                        {member.is_registered ? (
                          <span className="text-xs text-iridescent-green">Verificado</span>
                        ) : member.email ? (
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin cuenta</span>
                        )}
                      </div>
                    </div>
                    {member.user_id !== user?.id && group.members.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMember(member.id)}
                        className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Member Button */}
          <Dialog open={addMemberOpen} onOpenChange={(open) => { setAddMemberOpen(open); if (!open) resetSearch(); }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">
                <UserPlus className="w-4 h-4 mr-2" />
                Añadir Miembro
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/20">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-iridescent-green" />
                  Añadir miembro
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {!showManualAdd ? (
                  <>
                    {/* Search by friend code */}
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Busca por código de amigo (el usuario debe haber iniciado sesión al menos una vez)
                      </p>
                      
                      <div className="flex gap-2">
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                          placeholder="Ej: ABC123"
                          maxLength={6}
                          className="uppercase tracking-widest font-mono bg-white/5 border-white/10"
                          onKeyDown={(e) => e.key === "Enter" && searchUser()}
                        />
                        <Button
                          onClick={searchUser}
                          disabled={searching || searchQuery.length < 6}
                          variant="outline"
                          className="border-white/10 bg-white/5 hover:bg-white/10"
                        >
                          {searching ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      {searchError && (
                        <p className="text-sm text-red-400">{searchError}</p>
                      )}

                      {foundUser && (
                        <div className="p-4 rounded-xl bg-iridescent-green/10 border border-iridescent-green/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-iridescent-green/20 flex items-center justify-center text-iridescent-green font-medium">
                                {foundUser.display_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{foundUser.display_name}</p>
                                <p className="text-sm text-muted-foreground font-mono">{foundUser.friend_code}</p>
                              </div>
                            </div>
                            <Button
                              onClick={addFoundUser}
                              disabled={addingMember}
                              size="sm"
                              className="btn-iridescent"
                            >
                              {addingMember ? "Añadiendo..." : "Añadir"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-onyx px-2 text-muted-foreground">o</span>
                      </div>
                    </div>

                    {/* Manual add option */}
                    <Button
                      variant="outline"
                      className="w-full border-white/10 bg-white/5 hover:bg-white/10"
                      onClick={() => setShowManualAdd(true)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Agregar miembro sin cuenta
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Para personas que aún no usan la app
                    </p>
                  </>
                ) : (
                  <>
                    {/* Manual add form */}
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Agrega un miembro temporal. Podrá vincularse cuando cree su cuenta.
                      </p>
                      
                      <Input
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="Nombre del miembro"
                        className="bg-white/5 border-white/10"
                        onKeyDown={(e) => e.key === "Enter" && addManualMember()}
                      />

                      {searchError && (
                        <p className="text-sm text-red-400">{searchError}</p>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-white/10 bg-white/5 hover:bg-white/10"
                          onClick={() => {
                            setShowManualAdd(false);
                            setManualName("");
                            setSearchError("");
                          }}
                        >
                          Volver
                        </Button>
                        <Button
                          onClick={addManualMember}
                          disabled={addingMember || !manualName.trim()}
                          className="flex-1 btn-iridescent"
                        >
                          {addingMember ? "Añadiendo..." : "Añadir"}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Balances - Who owes whom */}
        {balances && balances.settlements.length > 0 && (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-iridescent-blue" />
                Quién debe a quién
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {balances.settlements.map((settlement, idx) => {
                const currentUserMemberId = group?.members.find(m => m.user_id === user?.id)?.id;
                const isCurrentUserDebtor = settlement.from === currentUserMemberId;
                const isCurrentUserCreditor = settlement.to === currentUserMemberId;
                
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      isCurrentUserDebtor
                        ? "bg-red-500/10 border-red-500/30"
                        : isCurrentUserCreditor
                          ? "bg-iridescent-green/10 border-iridescent-green/30"
                          : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">
                          {settlement.fromName.charAt(0).toUpperCase()}
                        </div>
                        <span className={`font-medium ${isCurrentUserDebtor ? "text-red-400" : "text-foreground"}`}>
                          {isCurrentUserDebtor ? "Tú" : settlement.fromName}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">
                          {settlement.toName.charAt(0).toUpperCase()}
                        </div>
                        <span className={`font-medium ${isCurrentUserCreditor ? "text-iridescent-green" : "text-foreground"}`}>
                          {isCurrentUserCreditor ? "Tú" : settlement.toName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${
                        isCurrentUserDebtor
                          ? "text-red-400"
                          : isCurrentUserCreditor
                            ? "text-iridescent-green"
                            : "text-foreground"
                      }`}>
                        ${settlement.amount.toFixed(2)}
                      </span>
                      {isCurrentUserDebtor && (
                        <Button
                          size="sm"
                          onClick={() => openSettleDialog(settlement)}
                          className="btn-iridescent"
                        >
                          <Wallet className="w-3 h-3 mr-1" />
                          Saldar
                        </Button>
                      )}
                      {isCurrentUserCreditor && (
                        <Button
                          size="sm"
                          onClick={() => openReminderDialog(settlement)}
                          disabled={sentReminders.has(settlement.from)}
                          className={sentReminders.has(settlement.from)
                            ? "bg-amber-600/20 text-amber-400 border border-amber-500/30 cursor-default"
                            : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"
                          }
                        >
                          <Bell className="w-3 h-3 mr-1" />
                          {sentReminders.has(settlement.from) ? "Enviado ✓" : "Recordar pago"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Settle Dialog */}
        <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
          <DialogContent className="glass-card border-white/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-iridescent-pink" />
                Registrar pago
              </DialogTitle>
            </DialogHeader>
            {selectedSettlement && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-muted-foreground">
                    Deuda con <span className="font-medium text-foreground">{selectedSettlement.toName}</span>
                  </p>
                  <p className="font-bold text-red-400 text-lg">${selectedSettlement.amount.toFixed(2)}</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="settleAmount" className="text-muted-foreground">Monto a pagar</Label>
                  <Input
                    id="settleAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedSettlement.amount}
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSettleAmount(selectedSettlement.amount.toFixed(2))}
                    className="flex-1 border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    Total (${selectedSettlement.amount.toFixed(2)})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSettleAmount((selectedSettlement.amount / 2).toFixed(2))}
                    className="flex-1 border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    Mitad (${(selectedSettlement.amount / 2).toFixed(2)})
                  </Button>
                </div>

                <Button
                  onClick={handleSettle}
                  disabled={settling || !settleAmount || parseFloat(settleAmount) <= 0}
                  className="w-full btn-iridescent glow-iridescent"
                >
                  {settling ? "Registrando..." : "Registrar pago"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reminder Dialog */}
        <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
          <DialogContent className="glass-card border-white/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                Enviar recordatorio de pago
              </DialogTitle>
            </DialogHeader>
            {reminderSettlement && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-muted-foreground">
                    Recordatorio para <span className="font-medium text-foreground">{reminderSettlement.fromName}</span>
                  </p>
                  <p className="font-bold text-amber-400 text-lg">${reminderSettlement.amount.toFixed(2)}</p>
                </div>

                {/* Image upload */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Imagen personalizada (opcional)</Label>
                  {reminderImagePreview ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img
                        src={reminderImagePreview}
                        alt="Vista previa"
                        className="w-full h-40 object-cover"
                      />
                      <button
                        onClick={() => { setReminderImageFile(null); setReminderImagePreview(null); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                      <ImagePlus className="w-7 h-7 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Toca para subir una imagen</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleReminderImageSelect}
                      />
                    </label>
                  )}
                </div>

                <Button
                  onClick={sendPaymentReminder}
                  disabled={sendingReminder === reminderSettlement.from || uploadingImage}
                  className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  {uploadingImage ? "Subiendo imagen..." : sendingReminder ? "Enviando..." : "Enviar recordatorio"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Member balances summary */}
        {balances && balances.memberBalances.some(m => Math.abs(m.balance) > 0.01) && (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="font-semibold text-foreground">Resumen de balances</h2>
            </div>
            <div className="p-4">
              <div className="grid gap-2">
                {balances.memberBalances.map((member) => {
                  const isCurrentUser = group?.members.find(m => m.id === member.id)?.user_id === user?.id;
                  if (Math.abs(member.balance) < 0.01) return null;
                  
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                    >
                      <span className="font-medium text-foreground">
                        {isCurrentUser ? "Tú" : member.name}
                      </span>
                      <span className={`font-semibold ${
                        member.balance > 0
                          ? "text-iridescent-green"
                          : member.balance < 0
                            ? "text-red-400"
                            : "text-muted-foreground"
                      }`}>
                        {member.balance > 0 ? "+" : ""}${member.balance.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Balance positivo = te deben • Negativo = debes
              </p>
            </div>
          </div>
        )}

        {/* Expenses list */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Receipt className="w-5 h-5 text-iridescent-pink" />
              Gastos del grupo
            </h2>
          </div>
          <div className="p-4">
            {expenses.length > 0 ? (
              <div className="space-y-3">
                {expenses.map((expense) => {
                  const currentUserMemberId = group?.members.find(m => m.user_id === user?.id)?.id;
                  const isPayer = expense.paid_by_member_id === currentUserMemberId;
                  
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Pagó: <span className={isPayer ? "text-iridescent-blue" : ""}>{isPayer ? "Tú" : expense.paid_by_name}</span>
                          {expense.expense_date && (
                            <span className="ml-2">
                              • {new Date(expense.expense_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-foreground">${expense.amount.toFixed(2)}</p>
                        {expense.your_share !== null && (
                          <p className={`text-xs ${
                            isPayer 
                              ? "text-iridescent-green" 
                              : expense.your_share > 0 
                                ? "text-red-400" 
                                : "text-muted-foreground"
                          }`}>
                            {isPayer ? "Pagaste" : `Tu parte: $${expense.your_share.toFixed(2)}`}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay gastos aún</p>
                <Link to={`/expenses/new?group=${id}`}>
                  <Button variant="link" className="text-iridescent-blue">
                    Añadir el primer gasto
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
