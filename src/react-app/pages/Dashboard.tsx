import { useCallback } from "react";
import { Link } from "react-router";
import { ArrowUpRight, ArrowDownLeft, Plus, Users, RefreshCw } from "lucide-react";
import AppLayout from "@/react-app/components/layout/AppLayout";
import { useCache, prefetch } from "@/react-app/hooks/useCache";

interface GroupBalance {
  id: number;
  name: string;
  emoji: string;
  balance: number;
}

interface DashboardData {
  groups: GroupBalance[];
  totalOwed: number;
  totalOwe: number;
}

export default function Dashboard() {
  const fetcher = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<DashboardData>;
  }, []);

  const { data, loading, refetch } = useCache<DashboardData>("dashboard", fetcher);

  // Prefetch groups data
  const handleGroupHover = (groupId: number) => {
    prefetch(`group-${groupId}`, async () => {
      const res = await fetch(`/api/groups/${groupId}`);
      return res.json();
    });
  };

  if (loading && !data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-iridescent-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const totalBalance = (data?.totalOwed || 0) - (data?.totalOwe || 0);
  const hasGroups = data && data.groups.length > 0;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Balance Summary */}
        <div className="text-center py-8 glass-card rounded-2xl relative overflow-hidden">
          {/* Refresh button */}
          <button 
            onClick={() => refetch()}
            className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Subtle aurora glow behind balance */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-radial from-iridescent-green/40 via-iridescent-blue/20 to-transparent blur-2xl" />
          </div>
          
          <div className="relative z-10">
            <p className="text-sm text-muted-foreground mb-2">Balance total</p>
            <p className={`text-5xl font-bold tracking-tight ${
              totalBalance > 0 
                ? "text-iridescent-green" 
                : totalBalance < 0 
                  ? "text-red-400" 
                  : "text-foreground"
            }`}>
              {totalBalance >= 0 ? "+" : ""}${totalBalance.toFixed(2)}
            </p>
            
            {(data?.totalOwed || data?.totalOwe) ? (
              <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-1.5 text-iridescent-green">
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Te deben ${data?.totalOwed.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-red-400">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Debes ${data?.totalOwe.toFixed(2)}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Groups */}
        {hasGroups ? (
          <div className="space-y-2">
            {data.groups.map((group) => (
              <Link
                key={group.id}
                to={`/groups/${group.id}`}
                className="flex items-center justify-between p-4 rounded-xl glass-card hover:bg-white/10 transition-all"
                onMouseEnter={() => handleGroupHover(group.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{group.emoji}</span>
                  <span className="font-medium text-foreground">{group.name}</span>
                </div>
                <span className={`font-semibold ${
                  group.balance > 0 
                    ? "text-iridescent-green" 
                    : group.balance < 0 
                      ? "text-red-400" 
                      : "text-muted-foreground"
                }`}>
                  {group.balance > 0 && "+"}${group.balance.toFixed(2)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 glass-card rounded-2xl">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No tienes grupos aún</p>
            <Link to="/groups/new">
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg btn-iridescent">
                <Plus className="w-4 h-4" />
                Crear grupo
              </button>
            </Link>
          </div>
        )}

        {/* Quick action */}
        {hasGroups && (
          <div className="flex gap-3">
            <Link to="/groups/new" className="flex-1">
              <button className="w-full py-3 rounded-xl glass-card text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all">
                <Plus className="w-4 h-4 inline mr-2" />
                Nuevo grupo
              </button>
            </Link>
            <Link to="/expenses/new" className="flex-1">
              <button className="w-full py-3 rounded-xl btn-iridescent">
                <Plus className="w-4 h-4 inline mr-2" />
                Añadir gasto
              </button>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
