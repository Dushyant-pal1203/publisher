import { useState } from "react";
import { useListOrders, useUpdateOrderStatus, useDeleteOrder, useGetSettings, OrderStatus, getListOrdersQueryKey, getGetOrdersSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Trash2, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  
  const { data: orders = [], isLoading } = useListOrders({
    status: statusFilter === "all" ? undefined : statusFilter
  });
  
  const { data: settings } = useGetSettings();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusChange = (id: number, status: OrderStatus) => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetOrdersSummaryQueryKey() });
          toast({ title: "Order status updated" });
        },
        onError: () => toast({ variant: "destructive", title: "Failed to update status" })
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      deleteOrder.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetOrdersSummaryQueryKey() });
            toast({ title: "Order deleted successfully" });
          },
          onError: () => toast({ variant: "destructive", title: "Failed to delete order" })
        }
      );
    }
  };

  const getWhatsAppLink = (order: any) => {
    if (!settings?.whatsappNumber) return null;
    const formattedTotal = new Intl.NumberFormat("en-IN", { style: "currency", currency: order.currency }).format(order.totalAmount);
    const msg = `Hi ${order.customerName},\nRegarding your order #${order.id} for "${order.articleTitle}" (Total: ${formattedTotal}).`;
    return `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/50 pb-4 gap-4">
        <h1 className="font-serif text-3xl">Orders</h1>
        
        <div className="flex bg-card p-1 rounded-sm border border-border/50 w-full sm:w-auto overflow-x-auto hide-scrollbar">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setStatusFilter("all")}
            className={`rounded-none px-3 py-1 h-8 text-xs font-medium uppercase tracking-wider ${statusFilter === "all" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground"}`}
          >
            All
          </Button>
          {Object.values(OrderStatus).map((status) => (
            <Button 
              key={status}
              variant="ghost" 
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={`rounded-none px-3 py-1 h-8 text-xs font-medium uppercase tracking-wider ${statusFilter === status ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground"}`}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : orders.length > 0 ? (
              orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const waLink = getWhatsAppLink(order);
                
                return (
                  <Collapsible key={order.id} asChild open={isExpanded} onOpenChange={(open) => setExpandedOrderId(open ? order.id : null)}>
                    <>
                      <TableRow className="group data-[state=open]:bg-muted/30">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-primary">#{order.id}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{order.articleTitle} x{order.quantity}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(order.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {new Intl.NumberFormat("en-IN", { style: "currency", currency: order.currency }).format(order.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={order.status} 
                            onValueChange={(val) => handleStatusChange(order.id, val as OrderStatus)}
                            disabled={updateStatus.isPending}
                          >
                            <SelectTrigger className="h-8 w-32 rounded-none border-border/50 text-xs uppercase tracking-wider bg-transparent">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(OrderStatus).map((s) => (
                                <SelectItem key={s} value={s} className="text-xs uppercase tracking-wider">{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {waLink && (
                            <Button variant="ghost" size="icon" asChild title="Reply on WhatsApp">
                              <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(order.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete Order">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/30 border-t-0">
                          <TableCell colSpan={7} className="p-0 border-t-0">
                            <div className="p-4 pl-12 grid sm:grid-cols-2 gap-6 bg-card border-x border-b border-border/50 mx-4 mb-4 rounded-b-sm shadow-inner shadow-black/5">
                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Customer Details</h4>
                                <div className="text-sm space-y-1">
                                  <p><span className="font-medium">Name:</span> {order.customerName}</p>
                                  <p><span className="font-medium">Phone:</span> {order.customerPhone}</p>
                                  {order.customerEmail && <p><span className="font-medium">Email:</span> {order.customerEmail}</p>}
                                  <p><span className="font-medium">Address:</span><br/>{order.customerAddress}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Order Details</h4>
                                <div className="text-sm space-y-1">
                                  <p><span className="font-medium">Payment Method:</span> <Badge variant="outline" className="text-[10px] uppercase rounded-none ml-1">{order.paymentMethod}</Badge></p>
                                  <p><span className="font-medium">Item:</span> {order.articleTitle} (ID: {order.articleId})</p>
                                  <p><span className="font-medium">Quantity:</span> {order.quantity}</p>
                                  {order.notes && (
                                    <div className="mt-2 p-3 bg-muted rounded-sm border border-border/50 text-muted-foreground">
                                      <span className="font-medium block mb-1">Customer Notes:</span>
                                      {order.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}