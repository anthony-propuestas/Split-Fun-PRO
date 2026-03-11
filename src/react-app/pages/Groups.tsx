import { useState, useCallback } from "react";
import { Link } from "react-router";
import { Plus, Users, ChevronRight, Wallet, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/react-app/components/ui/dialog";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import AppLayout from "@/react-app/components/layout/AppLayout";
import { useCache } from "@/react-app/hooks/useCache";

interface Group {
  id: number;
  name: string;
  emoji: string;
  description: string | null;
  member_count: number;
  total_expenses: number | null;
  user_balance: number;
}

interface Debt {
  groupId: number;
  groupName: string;
  emoji: string;
  myMemberId: number;
  toMemberId: number;
  toMemberName: string;
  amount: number;
}

export default function Groups() {
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [settling, setSettling] = useState(false);

  const groupsFetcher = useCallback(async () => {
    const res = await fetch("/api/groups");
    if (!res.ok) throw new Error("Failed to fetch groups");
    return res.json() as Promise<Group[]>;
  }, []);

  const debtsFetcher = useCallback(async () => {
    const res = await fetch("/api/my-debts");
    if (!res.ok) throw new Error("Failed to fetch debts");
    return res.json() as Promise<Debt[]>;
  }, []);

  const { data: groupsData, loading: groupsLoading, refetch: refetchGroups } = useCache<Group[]>("groups", groupsFetcher);
  const { data: debtsData, loading: debtsLoading, refetch: refetchDebts } = useCache<Debt[]>("debts", debtsFetcher);

  const groups = groupsData ?? [];
  const debts = debtsData ?? [];
  const loading = groupsLoading && groups.length === 0;

  const refetchAll = () => {
    refetchGroups();
    refetchDebts();
  };

  const getDebtsForGroup = (groupId: number) => {
    return debts.filter(d => d.groupId === groupId);
  };

  const openSettleDialog = (debt: Debt, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDebt(debt);
    setSettleAmount(debt.amount.toFixed(2));
    setSettleDialogOpen(true);
  };

  const handleSettle = async () => {
    if (!selectedDebt || !settleAmount) return;

    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) return;

    setSettling(true);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: selectedDebt.groupId,
          from_member_id: selectedDebt.myMemberId,
          to_member_id: selectedDebt.toMemberId,
          amount,
          note: `Pago de $${amount.toFixed(2)}`
        })
      });

      if (res.ok) {
        setSettleDialogOpen(false);
        setSelectedDebt(null);
        setSettleAmount("");
        refetchAll();
      }
    } catch (error) {
      console.error("Error settling:", error);
    } finally {
      setSettling(false);
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

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Grupos</h1>
            <p className="text-muted-foreground">Administra tus grupos de gastos compartidos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={refetchAll}
              className="text-muted-foreground hover:text-foreground"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${groupsLoading || debtsLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/groups/new">
              <Button className="btn-iridescent">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Grupo
              </Button>
            </Link>
          </div>
        </div>

        {/* Groups list */}
        {groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((group) => {
              const groupDebts = getDebtsForGroup(group.id);
              
              return (
                <div key={group.id} className="glass-card rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-200">
                  <div className="p-4">
                    <Link to={`/groups/${group.id}`} className="block">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                          {group.emoji}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{group.name}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="w-3.5 h-3.5" />
                            <span>{group.member_count} miembros</span>
                            {group.total_expenses && (
                              <>
                                <span className="mx-1">•</span>
                                <span>Total: ${group.total_expenses.toFixed(2)}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* User balance display */}
                        <div className="text-right mr-2">
                          {group.user_balance !== 0 ? (
                            <span className={`text-sm font-semibold ${
                              group.user_balance > 0 
                                ? "text-iridescent-green" 
                                : "text-red-400"
                            }`}>
                              {group.user_balance > 0 ? "+" : ""}${group.user_balance.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">$0.00</span>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {group.user_balance > 0 ? "te deben" : group.user_balance < 0 ? "debes" : "sin deudas"}
                          </p>
                        </div>

                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Link>

                    {/* Settle buttons for debts */}
                    {groupDebts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        {groupDebts.map((debt, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">Debes a</span>
                              <span className="font-medium text-foreground">{debt.toMemberName}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="font-semibold text-red-400">${debt.amount.toFixed(2)}</span>
                            </div>
                            <Button
                              size="sm"
                              onClick={(e) => openSettleDialog(debt, e)}
                              className="btn-iridescent text-xs h-7 px-3"
                            >
                              <Wallet className="w-3.5 h-3.5 mr-1.5" />
                              Saldar
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card rounded-xl border border-dashed border-white/20">
            <div className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No tienes grupos aún</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer grupo para empezar a dividir gastos
              </p>
              <Link to="/groups/new">
                <Button className="btn-iridescent">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Grupo
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Settle Dialog */}
      <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
        <DialogContent className="glass-card border-white/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Wallet className="w-5 h-5 text-iridescent-pink" />
              Saldar deuda
            </DialogTitle>
          </DialogHeader>

          {selectedDebt && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <span className="text-xl">{selectedDebt.emoji}</span>
                  <span>{selectedDebt.groupName}</span>
                </div>
                <p className="text-foreground">
                  Pagar a <span className="font-semibold">{selectedDebt.toMemberName}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Deuda total: <span className="text-red-400 font-medium">${selectedDebt.amount.toFixed(2)}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Monto a pagar</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedDebt.amount}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-foreground"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-white/10 bg-white/5 hover:bg-white/10"
                  onClick={() => setSettleAmount(selectedDebt.amount.toFixed(2))}
                >
                  Total (${selectedDebt.amount.toFixed(2)})
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-white/10 bg-white/5 hover:bg-white/10"
                  onClick={() => setSettleAmount((selectedDebt.amount / 2).toFixed(2))}
                >
                  Mitad (${(selectedDebt.amount / 2).toFixed(2)})
                </Button>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-white/10 bg-white/5 hover:bg-white/10"
                  onClick={() => setSettleDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSettle}
                  disabled={settling || !settleAmount || parseFloat(settleAmount) <= 0}
                  className="flex-1 btn-iridescent"
                >
                  {settling ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Registrar pago
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
