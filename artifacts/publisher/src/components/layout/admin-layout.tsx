import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingBag,
  Settings,
  LogOut,
} from "lucide-react";
import { useGetSettings } from "@workspace/api-client-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, login, logout } = useAuth();
  const [location] = useLocation();
  const { data: settings } = useGetSettings();

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-muted/30">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md w-full bg-card border shadow-sm rounded-lg p-8 text-center">
          <div className="h-25 w-25 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <img src="/images/ph-logo.png" alt="Logo" />
          </div>
          <h1 className="font-serif text-2xl mb-2">
            {settings?.publisherName || "Publisher"} Admin
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Please log in to manage the catalogue, view orders, and update
            settings.
          </p>
          <Button onClick={login} size="lg" className="w-full">
            Log in
          </Button>
          <div className="mt-6 text-sm">
            <Link href="/" className="text-muted-foreground hover:underline">
              &larr; Return to storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/articles", label: "Catalogue", icon: BookOpen },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/settings", label: "Settings", icon: Settings },
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
            onClick={logout}
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
