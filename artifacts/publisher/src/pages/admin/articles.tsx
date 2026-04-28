import { useState } from "react";
import {
  useListArticles,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
  Article,
  ArticleType,
  getListArticlesQueryKey,
  getGetCatalogSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ObjectUploader } from "@workspace/object-storage-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

const articleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  type: z.nativeEnum(ArticleType),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  currency: z.string().default("INR"),
  coverImageUrl: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  isbn: z.string().nullable().optional(),
  publishedYear: z.coerce.number().nullable().optional(),
  pageCount: z.coerce.number().nullable().optional(),
  language: z.string().nullable().optional(),
  publisher: z.string().nullable().optional(),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

export default function AdminArticles() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const { data: articles = [], isLoading } = useListArticles({
    search: search || undefined,
  });
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const deleteArticle = useDeleteArticle();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      author: "",
      type: ArticleType.book,
      description: "",
      price: 0,
      currency: "INR",
      coverImageUrl: null,
      category: "",
      isbn: "",
      publishedYear: new Date().getFullYear(),
      pageCount: 0,
      language: "English",
      publisher: "",
      inStock: true,
      featured: false,
    },
  });

  const openCreateModal = () => {
    setEditingArticle(null);
    form.reset({
      title: "",
      author: "",
      type: ArticleType.book,
      description: "",
      price: 0,
      currency: "INR",
      coverImageUrl: null,
      category: "",
      isbn: "",
      publishedYear: new Date().getFullYear(),
      pageCount: 0,
      language: "English",
      publisher: "",
      inStock: true,
      featured: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (article: Article) => {
    setEditingArticle(article);
    form.reset({
      title: article.title,
      author: article.author,
      type: article.type as ArticleType,
      description: article.description,
      price: article.price,
      currency: article.currency,
      coverImageUrl: article.coverImageUrl,
      category: article.category,
      isbn: article.isbn,
      publishedYear: article.publishedYear,
      pageCount: article.pageCount,
      language: article.language,
      publisher: article.publisher,
      inStock: article.inStock,
      featured: article.featured,
    });
    setIsModalOpen(true);
  };

  const onSubmit = (values: ArticleFormValues) => {
    if (editingArticle) {
      updateArticle.mutate(
        { id: editingArticle.id, data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListArticlesQueryKey(),
            });
            queryClient.invalidateQueries({
              queryKey: getGetCatalogSummaryQueryKey(),
            });
            setIsModalOpen(false);
            toast({ title: "Article updated successfully" });
          },
          onError: () =>
            toast({
              variant: "destructive",
              title: "Failed to update article",
            }),
        },
      );
    } else {
      createArticle.mutate(
        { data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListArticlesQueryKey(),
            });
            queryClient.invalidateQueries({
              queryKey: getGetCatalogSummaryQueryKey(),
            });
            setIsModalOpen(false);
            toast({ title: "Article created successfully" });
          },
          onError: () =>
            toast({
              variant: "destructive",
              title: "Failed to create article",
            }),
        },
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this article?")) {
      deleteArticle.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListArticlesQueryKey(),
            });
            queryClient.invalidateQueries({
              queryKey: getGetCatalogSummaryQueryKey(),
            });
            toast({ title: "Article deleted successfully" });
          },
          onError: () =>
            toast({
              variant: "destructive",
              title: "Failed to delete article",
            }),
        },
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/50 pb-4 gap-4">
        <h1 className="font-serif text-3xl">Catalogue</h1>
        <Button onClick={openCreateModal} className="rounded-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Article
        </Button>
      </div>

      <div className="flex items-center relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
        <Input
          placeholder="Search articles..."
          className="pl-9 bg-card border-border/50 rounded-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : articles.length > 0 ? (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {article.coverImageUrl ? (
                        <img
                          src={`/api/storage${article.coverImageUrl}`}
                          alt=""
                          className="w-8 h-10 object-cover rounded-sm border border-border/50"
                        />
                      ) : (
                        <div className="w-8 h-10 bg-muted flex items-center justify-center rounded-sm border border-border/50">
                          <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
                        </div>
                      )}
                      <div>
                        <div className="font-serif leading-tight">
                          {article.title}
                        </div>
                        {article.featured && (
                          <Badge className="text-[9px] px-1 py-0 h-4 mt-1 bg-primary border-none rounded-none">
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {article.author}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase rounded-none border-border/50"
                    >
                      {article.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: article.currency,
                    }).format(article.price)}
                  </TableCell>
                  <TableCell>
                    {article.inStock ? (
                      <span className="text-green-600 text-xs font-medium">
                        In Stock
                      </span>
                    ) : (
                      <span className="text-amber-600 text-xs font-medium">
                        Out of Stock
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(article)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(article.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No articles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm border-border/50">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {editingArticle ? "Edit Article" : "Add New Article"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="coverImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image</FormLabel>
                    <div className="flex items-center gap-4">
                      {field.value && (
                        <img
                          src={`/api/storage${field.value}`}
                          alt="Cover preview"
                          className="h-24 w-16 object-cover border border-border/50 rounded-sm shadow-sm"
                        />
                      )}
                      <ObjectUploader
                        onGetUploadParameters={async (file) => {
                          const res = await fetch(
                            "/api/storage/uploads/request-url",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                name: file.name,
                                size: file.size,
                                contentType: file.type,
                              }),
                            },
                          );
                          const { uploadURL } = await res.json();
                          return {
                            method: "PUT",
                            url: uploadURL,
                            headers: { "Content-Type": file.type },
                          };
                        }}
                        onComplete={(result) => {
                          if (
                            result.successful &&
                            result.successful.length > 0
                          ) {
                            const res = result.successful[0].response
                              ?.body as any;
                            if (res && res.objectPath) {
                              field.onChange(res.objectPath);
                            }
                          }
                        }}
                      >
                        <span className="text-sm font-medium">
                          Upload Cover
                        </span>
                      </ObjectUploader>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input className="rounded-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author</FormLabel>
                      <FormControl>
                        <Input className="rounded-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ArticleType).map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="rounded-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input className="rounded-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea className="rounded-sm min-h-25" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isbn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ISBN (optional)</FormLabel>
                      <FormControl>
                        <Input
                          className="rounded-sm"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="publisher"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publisher (optional)</FormLabel>
                      <FormControl>
                        <Input
                          className="rounded-sm"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="publishedYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="rounded-sm"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pageCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pages (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="rounded-sm"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <FormControl>
                        <Input
                          className="rounded-sm"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input
                          className="rounded-sm"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-6 pt-4 border-t border-border/50">
                <FormField
                  control={form.control}
                  name="inStock"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>In Stock</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Featured</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createArticle.isPending || updateArticle.isPending}
                >
                  {(createArticle.isPending || updateArticle.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingArticle ? "Save Changes" : "Create Article"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
