import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Map,
  Users,
  MessageCircle,
  Settings,
  LogOut,
  Truck,
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.role === "admin";

  const navItems = [
    { name: t.dashboard, href: "/dashboard", icon: LayoutDashboard, show: true },
    { name: t.calendar, href: "/calendar", icon: CalendarDays, show: true },
    { name: t.trips, href: "/trips", icon: Map, show: true },
    { name: t.drivers, href: "/drivers", icon: Users, show: isAdmin },
    { name: t.whatsapp, href: "/whatsapp", icon: MessageCircle, show: isAdmin },
    { name: t.settings, href: "/settings", icon: Settings, show: true },
  ];

  return (
    <aside className="w-72 hidden md:flex flex-col border-r border-white/5 bg-card/40 backdrop-blur-2xl h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-primary/20">
          <Truck className="w-6 h-6 text-white" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-white">{t.appName}</span>
      </div>

      <div className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.filter((i) => i.show).map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-medium text-sm",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-transform group-hover:scale-110",
                  isActive ? "text-primary" : ""
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 mt-auto border-t border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
            {user?.fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role === "admin" ? t.admin : t.driverRole}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {t.signOut}
        </button>
      </div>
    </aside>
  );
}
