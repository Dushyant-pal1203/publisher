import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  useGetSettings,
  useGetCatalogSummary,
  useListArticles,
  ArticleType,
  Article,
} from "@workspace/api-client-react";
import { Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ArticleCard from "@/components/article-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: settings } = useGetSettings();
  const { data: catalog, isLoading: isCatalogLoading } = useGetCatalogSummary();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<ArticleType | "all">("all");

  const { data: articlesData, isLoading: isArticlesLoading } = useListArticles({
    search: search || undefined,
    type: selectedType === "all" ? undefined : selectedType,
  });

  // Handle both array and object responses
  const articles = useMemo(() => {
    if (Array.isArray(articlesData)) {
      return articlesData;
    }
    // If the response is an object with a data property containing the array
    if (
      articlesData &&
      typeof articlesData === "object" &&
      "data" in articlesData &&
      Array.isArray((articlesData as any).data)
    ) {
      return (articlesData as any).data;
    }
    // If it's some other object, try to extract array-like properties
    if (articlesData && typeof articlesData === "object") {
      // Check common response wrappers
      const possibleArrays = ["articles", "items", "results"];
      for (const key of possibleArrays) {
        if (
          (articlesData as any)[key] &&
          Array.isArray((articlesData as any)[key])
        ) {
          return (articlesData as any)[key];
        }
      }
    }
    return [];
  }, [articlesData]);

  const featuredArticles = useMemo(() => {
    return catalog?.featured || [];
  }, [catalog]);

  console.log("articlesData:", articlesData); // Debug: log the actual response
  console.log("articles:", articles); // Debug: log the processed array

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-card border-b border-border/50 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="font-serif text-5xl md:text-7xl text-primary tracking-tight leading-tight">
            {settings?.publisherName || "My Publishing House"}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto">
            {settings?.tagline ||
              "Independent publisher of thoughtful literature, essays, and academic journals."}
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 space-y-16">
        {/* Featured Section */}
        {isCatalogLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="aspect-3/4 w-full rounded-sm" />
            <Skeleton className="aspect-3/4 w-full rounded-sm" />
            <Skeleton className="aspect-3/4 w-full rounded-sm" />
          </div>
        ) : featuredArticles.length > 0 ? (
          <section>
            <div className="flex items-center justify-between mb-8 border-b border-border/50 pb-4">
              <h2 className="font-serif text-3xl">Featured Releases</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {featuredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Catalogue Section */}
        <section id="catalogue">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-border/50 pb-4 gap-4">
            <h2 className="font-serif text-3xl">Complete Catalogue</h2>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search titles, authors..."
                  className="pl-9 bg-card border-border/50 focus-visible:ring-primary rounded-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex bg-card p-1 rounded-sm border border-border/50 w-full sm:w-auto overflow-x-auto hide-scrollbar">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedType("all")}
                  className={`rounded-none px-3 py-1 h-8 text-xs font-medium uppercase tracking-wider ${selectedType === "all" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground"}`}
                >
                  All
                </Button>
                {Object.values(ArticleType).map((type) => (
                  <Button
                    key={type}
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedType(type)}
                    className={`rounded-none px-3 py-1 h-8 text-xs font-medium uppercase tracking-wider ${selectedType === type ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground"}`}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {isArticlesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-3/4 w-full rounded-sm" />
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {articles.map((article: Article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center bg-card rounded-sm border border-border/50 border-dashed">
              <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-serif text-xl mb-2">No publications found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We couldn't find any items matching your search criteria. Try
                adjusting your filters.
              </p>
              {(search || selectedType !== "all") && (
                <Button
                  variant="outline"
                  className="mt-6 rounded-sm border-border/50"
                  onClick={() => {
                    setSearch("");
                    setSelectedType("all");
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
