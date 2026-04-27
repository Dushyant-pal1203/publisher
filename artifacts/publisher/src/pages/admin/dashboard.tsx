import { useGetCatalogSummary, useGetOrdersSummary, OrderStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ShoppingBag, IndianRupee, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: catalog, isLoading: catalogLoading } = useGetCatalogSummary();
  const { data: orders, isLoading: ordersLoading } = useGetOrdersSummary();

  const formattedRevenue = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(orders?.totalRevenue || 0);

  if (catalogLoading || ordersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <h1 className="font-serif text-3xl">Dashboard</h1>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-sm" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Skeleton className="h-64 w-full rounded-sm" />
          <Skeleton className="h-64 w-full rounded-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <h1 className="font-serif text-3xl">Dashboard</h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-sm border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <IndianRupee className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif text-primary">{formattedRevenue}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-sm border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif text-primary">{orders?.totalOrders || 0}</div>
          </CardContent>
        </Card>

        <Card className="rounded-sm border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif text-primary">{orders?.pendingOrders || 0}</div>
          </CardContent>
        </Card>

        <Card className="rounded-sm border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Catalogue Size</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif text-primary">{catalog?.totalArticles || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Card className="rounded-sm border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders?.recent && orders.recent.length > 0 ? (
              <div className="space-y-4">
                {orders.recent.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b border-border/50 last:border-0 pb-4 last:pb-0">
                    <div>
                      <p className="font-medium text-primary">#{order.id} - {order.customerName}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{order.articleTitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: order.currency }).format(order.totalAmount)}
                      </p>
                      <Badge variant={order.status === OrderStatus.pending ? "default" : "secondary"} className="mt-1 text-[10px] uppercase rounded-none border-none">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Link href="/admin/orders" className="text-sm text-primary hover:underline">
                    View all orders &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No recent orders found.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-sm border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Catalogue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {catalog?.byType && catalog.byType.length > 0 ? (
              <div className="space-y-4">
                {catalog.byType.map((type) => (
                  <div key={type.type} className="flex items-center justify-between">
                    <span className="uppercase tracking-widest text-xs font-medium text-muted-foreground">{type.type}</span>
                    <span className="font-serif text-primary">{type.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Catalogue is empty.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}