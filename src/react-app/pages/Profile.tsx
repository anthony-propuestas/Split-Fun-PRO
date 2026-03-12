import { useState, useEffect } from "react";
import { Copy, Check, User, Sparkles } from "lucide-react";
import { useAuth } from "@/react-app/context/AuthContext";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import AppLayout from "@/react-app/components/layout/AppLayout";

interface UserProfile {
  user_id: string;
  friend_code: string;
  display_name: string;
  email: string;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setNewName(data.display_name);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const copyCode = async () => {
    if (!profile) return;
    await navigator.clipboard.writeText(profile.friend_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveName = async () => {
    if (!newName.trim() || newName === profile?.display_name) {
      setEditingName(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: newName.trim() }),
      });
      if (res.ok) {
        setProfile((p) => p ? { ...p, display_name: newName.trim() } : null);
        setEditingName(false);
      }
    } catch (error) {
      console.error("Error saving name:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-iridescent-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Tu Perfil</h1>

        {/* Friend Code Card - with aurora effect */}
        <div className="relative overflow-hidden rounded-2xl">
          {/* Aurora background for this card */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-iridescent-green/20 via-iridescent-blue/15 to-iridescent-pink/20 animate-aurora-pulse" />
            <div className="absolute inset-0 bg-onyx/50 backdrop-blur-sm" />
          </div>
          
          <div className="relative glass-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-semibold text-foreground">Tu Código de Amigo</h2>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Comparte este código para que otros te encuentren y te añadan a sus grupos
            </p>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white/5 rounded-xl p-4 text-center border border-white/10">
                <span className="text-3xl font-mono font-bold tracking-[0.3em] text-iridescent">
                  {profile?.friend_code}
                </span>
              </div>
              <Button
                onClick={copyCode}
                variant="outline"
                size="lg"
                className={`border-white/20 bg-white/5 hover:bg-white/10 ${copied ? "bg-iridescent-green/20 border-iridescent-green/50 text-iridescent-green" : ""}`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-iridescent-blue" />
              <h2 className="font-semibold text-foreground">Información</h2>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Nombre para mostrar</label>
              {editingName ? (
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 bg-white/5 border-white/10"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                  />
                  <Button
                    onClick={saveName}
                    disabled={saving}
                    size="sm"
                    className="btn-iridescent"
                  >
                    {saving ? "..." : "Guardar"}
                  </Button>
                  <Button
                    onClick={() => { setEditingName(false); setNewName(profile?.display_name || ""); }}
                    variant="outline"
                    size="sm"
                    className="border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <p className="font-medium text-foreground">{profile?.display_name}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditingName(true)}
                    className="hover:bg-white/5"
                  >
                    Editar
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <p className="font-medium text-foreground mt-1">{profile?.email || user?.email}</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <Button
          onClick={logout}
          variant="outline"
          className="w-full text-red-400 border-red-400/30 hover:bg-red-400/10 hover:border-red-400/50"
        >
          Cerrar sesión
        </Button>
      </div>
    </AppLayout>
  );
}
