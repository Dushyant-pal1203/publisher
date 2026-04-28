import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingBag,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";
import { useGetSettings } from "@workspace/api-client-react";

interface AdminUser {
  id: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location] = useLocation();
  const { data: settings } = useGetSettings();

  useEffect(() => {
    // Check authentication status
    fetch("/api/admin-auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setIsLoading(false);
      })
      .catch(() => {
        setUser(null);
        setIsLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin-auth/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/admin/login";
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/admin/login";
    return null;
  }

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/articles", label: "Catalogue", icon: BookOpen },
    { href: "/orders", label: "Orders", icon: ShoppingBag },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-dvh flex flex-col md:flex-row bg-muted/10">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border/50 shrink-0 flex flex-col sticky top-0 md:h-dvh">
        <div className="p-6 border-b border-border/50">
          <Link
            href="/"
            className="font-serif text-xl text-primary tracking-tight block"
          >
            {settings?.publisherName || "Publisher"}
          </Link>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">
            Administration
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {user.firstName} {user.lastName}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon
                  className={`w-4 h-4 ${isActive ? "text-primary" : ""}`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}
