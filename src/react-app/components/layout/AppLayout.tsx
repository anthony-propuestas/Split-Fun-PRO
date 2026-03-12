import { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { Users, Receipt, Home, Plus, LogOut, User, Bell, Trophy } from "lucide-react";
import { useAuth } from "@/react-app/context/AuthContext";
import { Button } from "@/react-app/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/react-app/components/ui/avatar";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/dashboard", label: "Inicio", icon: Home },
  { path: "/groups", label: "Grupos", icon: Users },
  { path: "/expenses", label: "Gastos", icon: Receipt },
  { path: "/don-barriga", label: "Don Barriga", icon: Bell },
  { path: "/logros", label: "Logros", icon: Trophy },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const userInitials = user?.google_user_data?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-onyx flex relative">
      {/* Aurora background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-gradient-radial from-iridescent-green/10 via-transparent to-transparent animate-aurora-pulse" />
        <div className="absolute -top-1/4 -right-1/4 w-full h-full bg-gradient-radial from-iridescent-blue/10 via-transparent to-transparent animate-aurora-pulse" style={{ animationDelay: '-3s' }} />
        <div className="absolute -bottom-1/4 left-1/4 w-full h-full bg-gradient-radial from-iridescent-pink/8 via-transparent to-transparent animate-aurora-pulse" style={{ animationDelay: '-5s' }} />
      </div>

      {/* Sidebar */}
      <aside className="w-64 glass-card border-r border-white/10 hidden md:flex flex-col relative z-10">
        <div className="p-6 border-b border-white/10">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src="https://019c8165-c866-7049-81dc-366b06644ca0.mochausercontent.com/1000068568.png" alt="Split Fun" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-semibold text-iridescent">Split Fun</span>
          </Link>
        </div>

        {/* User info */}
        {user && (
          <Link to="/profile" className="block p-4 border-b border-white/10 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 ring-2 ring-iridescent-blue/30">
                <AvatarImage src={user.google_user_data?.picture || undefined} />
                <AvatarFallback className="bg-white/10 text-foreground text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.google_user_data?.name || user.email}
                </p>
                <p className="text-xs text-iridescent-blue">Ver mi código de amigo →</p>
              </div>
            </div>
          </Link>
        )}

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link to="/expenses/new">
            <Button className="w-full btn-iridescent">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Gasto
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:bg-white/5"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="https://019c8165-c866-7049-81dc-366b06644ca0.mochausercontent.com/1000068568.png" alt="Split Fun" className="w-7 h-7 rounded-lg" />
            <span className="font-semibold text-iridescent">Split Fun</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/expenses/new">
              <Button size="sm" className="btn-iridescent">
                <Plus className="w-4 h-4" />
              </Button>
            </Link>
            {user && (
              <Link to="/profile">
                <Avatar className="w-8 h-8 ring-2 ring-iridescent-blue/30">
                  <AvatarImage src={user.google_user_data?.picture || undefined} />
                  <AvatarFallback className="bg-white/10 text-foreground text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-white/10">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                  isActive ? "text-iridescent-blue" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
          <Link
            to="/profile"
            className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
              location.pathname === "/profile" ? "text-iridescent-blue" : "text-muted-foreground"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs">Perfil</span>
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 md:p-8 p-4 pt-20 pb-24 md:pt-8 md:pb-8 overflow-auto relative z-10">
        {children}
      </main>
    </div>
  );
}
