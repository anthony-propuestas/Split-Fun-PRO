import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Plus, X, Search, UserPlus, Check } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { Textarea } from "@/react-app/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import AppLayout from "@/react-app/components/layout/AppLayout";

const emojis = ["💰", "🏠", "✈️", "🍻", "❤️", "🎉", "🍕", "⚽", "🎮", "📚", "💼", "🏖️"];

interface PendingMember {
  name: string;
  userId?: string;
  isRegistered: boolean;
}

export default function NewGroup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💰");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<PendingMember[]>([]);
  
  // Friend code search
  const [friendCode, setFriendCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ name: string; userId: string } | null>(null);
  const [searchError, setSearchError] = useState("");
  
  // Manual add
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualName, setManualName] = useState("");

  const searchByFriendCode = async () => {
    const code = friendCode.trim().toUpperCase();
    if (code.length !== 6) {
      setSearchError("El código debe tener 6 caracteres");
      return;
    }

    setSearching(true);
    setSearchError("");
    setSearchResult(null);

    try {
      const res = await fetch(`/api/users/search?q=${code}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          // Check if already added
          if (members.some(m => m.userId === data.user.user_id)) {
            setSearchError("Este usuario ya está en la lista");
          } else {
            setSearchResult({ 
              name: data.user.display_name || "Usuario", 
              userId: data.user.user_id 
            });
          }
        } else {
          setSearchError("No se encontró ningún usuario con ese código");
        }
      } else {
        setSearchError("No se encontró ningún usuario con ese código");
      }
    } catch {
      setSearchError("Error al buscar usuario");
    } finally {
      setSearching(false);
    }
  };

  const addFoundUser = () => {
    if (searchResult) {
      setMembers([...members, { 
        name: searchResult.name, 
        userId: searchResult.userId,
        isRegistered: true 
      }]);
      setSearchResult(null);
      setFriendCode("");
    }
  };

  const addManualMember = () => {
    const trimmedName = manualName.trim();
    if (trimmedName) {
      setMembers([...members, { name: trimmedName, isRegistered: false }]);
      setManualName("");
      setShowManualAdd(false);
    }
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      // Create group
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, emoji, description }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Add additional members
      for (const member of members) {
        await fetch(`/api/groups/${data.id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: member.name, 
            user_id: member.userId 
          }),
        });
      }

      navigate(`/groups/${data.id}`);
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/groups">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nuevo Grupo</h1>
            <p className="text-muted-foreground">Crea un grupo para dividir gastos</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Información del grupo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Emoji</Label>
                <div className="flex flex-wrap gap-2">
                  {emojis.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        emoji === e
                          ? "bg-neon-cyan/20 ring-2 ring-neon-cyan"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre del grupo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Hogar, Viaje a París, Amigos..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Una breve descripción del grupo..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Miembros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Tú serás añadido automáticamente. Agrega a los demás miembros usando su código de amigo:
              </p>

              {/* Member list */}
              {members.length > 0 && (
                <div className="space-y-2">
                  {members.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${member.isRegistered ? 'bg-neon-green' : 'bg-muted-foreground'}`} />
                        <p className="font-medium text-foreground">{member.name}</p>
                        {!member.isRegistered && (
                          <span className="text-xs text-muted-foreground">(sin cuenta)</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMember(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Friend code search */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={friendCode}
                    onChange={(e) => {
                      setFriendCode(e.target.value.toUpperCase().slice(0, 6));
                      setSearchError("");
                      setSearchResult(null);
                    }}
                    placeholder="Código de amigo (6 caracteres)"
                    maxLength={6}
                    className="font-mono tracking-wider"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchByFriendCode())}
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={searchByFriendCode}
                    disabled={searching || friendCode.length !== 6}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {searchError && (
                  <p className="text-sm text-red-400">{searchError}</p>
                )}

                {searchResult && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-neon-green/10 border border-neon-green/30">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-neon-green" />
                      <span className="text-foreground">{searchResult.name}</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={addFoundUser}
                      className="bg-neon-green hover:bg-neon-green/90 text-black"
                    >
                      Agregar
                    </Button>
                  </div>
                )}

                {/* Manual add option */}
                {!showManualAdd ? (
                  <button
                    type="button"
                    onClick={() => setShowManualAdd(true)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Agregar miembro sin cuenta
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Nombre del miembro"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManualMember())}
                      autoFocus
                    />
                    <Button type="button" variant="secondary" onClick={addManualMember}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => { setShowManualAdd(false); setManualName(""); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Link to="/groups" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-medium glow-cyan"
            >
              {loading ? "Creando..." : "Crear Grupo"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
