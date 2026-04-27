import { ReactNode } from "react";
import { Link } from "wouter";
import { useGetSettings } from "@workspace/api-client-react";

export default function StoreLayout({ children }: { children: ReactNode }) {
  const { data: settings } = useGetSettings();

  return (
    <div className="min-h-dvh flex flex-col selection:bg-primary selection:text-primary-foreground">
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-2xl tracking-tight text-primary transition-opacity hover:opacity-80"
          >
            {settings?.publisherName || "My Publishing House"}
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Catalogue
            </Link>
            <Link
              href="/about"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/50 py-12 mt-20 bg-card">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-8">
          <div>
            <h3 className="font-serif text-xl mb-2">
              {settings?.publisherName || "My Publishing House"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              {settings?.tagline ||
                "Independent publisher of thoughtful literature."}
            </p>
          </div>
          <div className="flex flex-col md:items-end text-sm text-muted-foreground gap-2">
            <Link
              href="/about"
              className="hover:text-foreground transition-colors"
            >
              About Us
            </Link>
            {settings?.contactEmail && (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="hover:text-foreground transition-colors"
              >
                Contact
              </a>
            )}
            <p className="mt-4">
              &copy; {new Date().getFullYear()} {settings?.publisherName}. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
