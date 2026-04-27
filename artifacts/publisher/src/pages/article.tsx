import { useParams } from "wouter";
import { useGetArticle, useGetSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowLeft, Loader2, Check, Info } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import OrderModal from "@/components/order-modal";
import { useState } from "react";

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const {
    data: article,
    isLoading,
    error,
  } = useGetArticle(Number(id), {
    query: {
      enabled: !!id && !isNaN(Number(id)),
      queryKey: ["article", id],
    },
  });

  const { data: settings } = useGetSettings();

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to catalogue
        </Link>
        <div className="grid md:grid-cols-2 gap-12">
          <Skeleton className="aspect-3/4 w-full max-w-md rounded-sm" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h1 className="font-serif text-3xl mb-4">Publication not found</h1>
        <p className="text-muted-foreground mb-8">
          The item you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/">
          <Button variant="outline" className="rounded-sm">
            Return to catalogue
          </Button>
        </Link>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: article.currency || "INR",
    minimumFractionDigits: 0,
  }).format(article.price);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-16">
      <Link
        href="/"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />{" "}
        Back to catalogue
      </Link>

      <div className="grid md:grid-cols-12 gap-12 items-start">
        {/* Left Column: Image */}
        <div className="md:col-span-5 md:sticky md:top-24">
          <div className="aspect-3/4 w-full bg-muted relative overflow-hidden flex items-center justify-center border border-border/50 rounded-sm shadow-lg shadow-black/5">
            {article.coverImageUrl ? (
              <img
                src={`/api/storage${article.coverImageUrl}`}
                alt={`Cover for ${article.title}`}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/5 p-8 text-center">
                <div className="border border-primary/20 p-6 h-full w-full flex flex-col items-center justify-center bg-card shadow-sm">
                  <BookOpen className="w-12 h-12 text-primary/30 mb-4" />
                  <h3 className="font-serif text-2xl text-primary leading-tight">
                    {article.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-4 font-medium uppercase tracking-widest">
                    {article.author}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="md:col-span-7 flex flex-col min-h-[calc(100vh-200px)]">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Badge
                variant="outline"
                className="text-xs font-medium uppercase tracking-widest rounded-sm border-border/50 text-muted-foreground"
              >
                {article.type}
              </Badge>
              {article.featured && (
                <Badge
                  variant="default"
                  className="text-[10px] uppercase tracking-wider px-2 py-0 h-5 font-medium rounded-none bg-primary text-primary-foreground border-none"
                >
                  Featured
                </Badge>
              )}
            </div>

            <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-2 text-foreground">
              {article.title}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-serif italic mb-8">
              By {article.author}
            </p>

            <div className="flex items-baseline gap-4 mb-8 pb-8 border-b border-border/50">
              <span className="text-3xl font-semibold text-primary">
                {formattedPrice}
              </span>
              {article.inStock ? (
                <span className="flex items-center text-sm font-medium text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-500/10 px-2.5 py-1 rounded-sm">
                  <Check className="w-3.5 h-3.5 mr-1.5" /> In stock
                </span>
              ) : (
                <span className="flex items-center text-sm font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-sm">
                  <Info className="w-3.5 h-3.5 mr-1.5" /> Temporarily
                  unavailable
                </span>
              )}
            </div>

            <div className="prose prose-stone dark:prose-invert max-w-none mb-10 text-muted-foreground leading-relaxed font-light">
              {article.description.split("\n").map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            <div className="bg-card border border-border/50 rounded-sm p-6 mb-10">
              <h3 className="font-serif text-lg mb-4">Publication Details</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {article.publisher && (
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground font-medium mb-0.5">
                      Publisher
                    </dt>
                    <dd>{article.publisher}</dd>
                  </div>
                )}
                {article.publishedYear && (
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground font-medium mb-0.5">
                      Published
                    </dt>
                    <dd>{article.publishedYear}</dd>
                  </div>
                )}
                {article.isbn && (
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground font-medium mb-0.5">
                      ISBN
                    </dt>
                    <dd className="font-mono text-xs mt-0.5">{article.isbn}</dd>
                  </div>
                )}
                {article.pageCount && (
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground font-medium mb-0.5">
                      Format
                    </dt>
                    <dd>{article.pageCount} pages</dd>
                  </div>
                )}
                {article.language && (
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground font-medium mb-0.5">
                      Language
                    </dt>
                    <dd>{article.language}</dd>
                  </div>
                )}
                {article.category && (
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground font-medium mb-0.5">
                      Category
                    </dt>
                    <dd>{article.category}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <div className="sticky bottom-0 bg-background/95 backdrop-blur py-4 border-t border-border/50 md:border-none md:bg-transparent md:py-0 md:static mt-auto">
            <Button
              size="lg"
              className="w-full rounded-sm h-14 text-base font-medium tracking-wide"
              disabled={!article.inStock}
              onClick={() => setIsOrderModalOpen(true)}
            >
              {article.inStock ? "Order now" : "Out of stock"}
            </Button>
            {settings?.whatsappNumber && article.inStock && (
              <p className="text-center text-xs text-muted-foreground mt-3 font-medium">
                Orders can be placed via WhatsApp or bank transfer.
              </p>
            )}
          </div>
        </div>
      </div>

      {article && (
        <OrderModal
          article={article}
          open={isOrderModalOpen}
          onOpenChange={setIsOrderModalOpen}
        />
      )}
    </div>
  );
}
