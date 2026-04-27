import { Link } from "wouter";
import { Article } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: article.currency || "INR",
    minimumFractionDigits: 0,
  }).format(article.price);

  return (
    <Link
      href={`/articles/${article.id}`}
      className="group flex flex-col h-full "
    >
      <Card className="flex-1 rounded-sm border-border/50 overflow-hidden bg-card transition-all duration-300 hover:shadow-md hover:-translate-y-1">
        <div className="aspect-3/4 w-full bg-muted relative overflow-hidden flex items-center justify-center border-b border-border/50">
          {article.coverImageUrl ? (
            <img
              src={`/api/storage${article.coverImageUrl}`}
              alt={`Cover for ${article.title}`}
              className="object-cover w-full h-full"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/5 p-6 text-center">
              <div className="border border-primary/20 p-4 h-full w-full flex flex-col items-center justify-center bg-card shadow-sm">
                <BookOpen className="w-8 h-8 text-primary/40 mb-3" />
                <h3 className="font-serif text-lg text-primary leading-tight line-clamp-3">
                  {article.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 font-medium uppercase tracking-widest">
                  {article.author}
                </p>
              </div>
            </div>
          )}

          <div className="absolute top-2 left-2 flex gap-1 flex-col items-start">
            {article.featured && (
              <Badge
                variant="default"
                className="text-[10px] uppercase tracking-wider px-2 py-0 h-5 font-medium rounded-none bg-primary text-primary-foreground border-none"
              >
                Featured
              </Badge>
            )}
            {!article.inStock && (
              <Badge
                variant="secondary"
                className="text-[10px] uppercase tracking-wider px-2 py-0 h-5 font-medium rounded-none bg-muted-foreground text-muted border-none"
              >
                Out of Stock
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                {article.type}
              </span>
              <span className="font-semibold text-primary">
                {formattedPrice}
              </span>
            </div>
            <h2 className="font-serif text-xl leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </h2>
            <p className="text-sm text-muted-foreground">{article.author}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
