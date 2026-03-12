import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Plus, Receipt } from "lucide-react";
import { useAuth } from "@/react-app/context/AuthContext";
import { Button } from "@/react-app/components/ui/button";
import AppLayout from "@/react-app/components/layout/AppLayout";

interface Expense {
  id: number;
  description: string;
  amount: number;
  group_name: string;
  group_emoji: string;
  paid_by_name: string;
  paid_by_user_id: string | null;
  your_share: number | null;
  created_at: string;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hoy";
  if (date.toDateString() === yesterday.toDateString()) return "Ayer";

  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await fetch("/api/expenses");
        if (res.ok) {
          setExpenses(await res.json());
        }
      } catch (error) {
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Gastos</h1>
          <Link to="/expenses/new">
            <Button className="bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo
            </Button>
          </Link>
        </div>

        {expenses.length > 0 ? (
          <div className="space-y-2">
            {expenses.map((expense) => {
              const paidByYou = expense.paid_by_user_id === user?.id;
              return (
                <div
                  key={expense.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg">
                    {expense.group_emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {expense.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {paidByYou ? (
                        <span className="text-neon-cyan">Pagaste tú</span>
                      ) : (
                        <span>Pagó {expense.paid_by_name}</span>
                      )}
                      <span className="mx-1">•</span>
                      {expense.group_name}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      ${expense.amount.toFixed(2)}
                    </p>
                    {expense.your_share !== null && (
                      <p className="text-sm text-muted-foreground">
                        Tu parte: ${expense.your_share.toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {formatDate(expense.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No hay gastos aún</p>
            <Link to="/expenses/new">
              <Button className="bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium">
                <Plus className="w-4 h-4 mr-2" />
                Añadir gasto
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
