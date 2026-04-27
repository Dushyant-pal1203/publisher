import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Article, useCreateOrder, useGetSettings, PaymentMethod, getListOrdersQueryKey, getGetOrdersSummaryQueryKey, getGetCatalogSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check, ExternalLink } from "lucide-react";

interface OrderModalProps {
  article: Article;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const orderSchema = z.object({
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email is required").optional().or(z.literal('')),
  customerPhone: z.string().min(5, "Phone number is required"),
  customerAddress: z.string().min(10, "Complete delivery address is required"),
  notes: z.string().optional(),
  paymentMethod: z.enum([PaymentMethod.whatsapp, PaymentMethod.online]),
});

type OrderFormValues = z.infer<typeof orderSchema>;

export default function OrderModal({ article, open, onOpenChange }: OrderModalProps) {
  const { data: settings } = useGetSettings();
  const createOrder = useCreateOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [step, setStep] = useState<"form" | "success_whatsapp" | "success_online">("form");
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      quantity: 1,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      notes: "",
      paymentMethod: PaymentMethod.whatsapp,
    },
  });

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: article.currency || "INR",
    minimumFractionDigits: 0,
  }).format(article.price * form.watch("quantity"));

  const onSubmit = (values: OrderFormValues) => {
    createOrder.mutate(
      {
        data: {
          articleId: article.id,
          quantity: values.quantity,
          customerName: values.customerName,
          customerEmail: values.customerEmail || null,
          customerPhone: values.customerPhone,
          customerAddress: values.customerAddress,
          notes: values.notes || null,
          paymentMethod: values.paymentMethod,
        },
      },
      {
        onSuccess: (order) => {
          setCreatedOrderId(order.id);
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetOrdersSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCatalogSummaryQueryKey() });

          if (values.paymentMethod === PaymentMethod.whatsapp) {
            setStep("success_whatsapp");
            // Construct and open WhatsApp link
            if (settings?.whatsappNumber) {
              const msg = `Hi, I'd like to confirm my order #${order.id}.
Title: ${article.title}
Quantity: ${order.quantity}
Total: ${new Intl.NumberFormat("en-IN", { style: "currency", currency: order.currency }).format(order.totalAmount)}
Name: ${order.customerName}
Address: ${order.customerAddress}`;
              
              const encodedMsg = encodeURIComponent(msg);
              window.open(`https://wa.me/${settings.whatsappNumber}?text=${encodedMsg}`, '_blank');
            }
          } else {
            setStep("success_online");
          }
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Error placing order",
            description: err?.error || "Something went wrong. Please try again.",
          });
        },
      }
    );
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setStep("form");
      setCreatedOrderId(null);
      form.reset();
    }, 300);
  };

  const copyToClipboard = (text: string, type: 'bank' | 'upi') => {
    navigator.clipboard.writeText(text);
    if (type === 'bank') {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    } else {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-sm border-border/50 bg-card p-0 shadow-xl">
        <div className="p-6 border-b border-border/50 bg-muted/30">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {step === "form" ? "Place your order" : "Order received"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              {article.title} by {article.author}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          {step === "form" && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-muted p-4 rounded-sm mb-6 flex justify-between items-center border border-border/50">
                  <span className="font-medium text-muted-foreground">Total amount</span>
                  <span className="font-serif text-xl text-primary">{formattedPrice}</span>
                </div>

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Payment method</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 p-4 border border-border/50 rounded-sm bg-card [&:has([data-state=checked])]:border-primary transition-colors cursor-pointer relative">
                            <FormControl>
                              <RadioGroupItem value={PaymentMethod.whatsapp} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-medium cursor-pointer">
                                WhatsApp order
                              </FormLabel>
                              <FormDescription className="text-xs">
                                Confirm order details and arrange payment via WhatsApp.
                              </FormDescription>
                            </div>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 p-4 border border-border/50 rounded-sm bg-card [&:has([data-state=checked])]:border-primary transition-colors cursor-pointer">
                            <FormControl>
                              <RadioGroupItem value={PaymentMethod.online} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-medium cursor-pointer">
                                Bank Transfer / UPI
                              </FormLabel>
                              <FormDescription className="text-xs">
                                Receive payment details instantly to transfer manually.
                              </FormDescription>
                            </div>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" className="rounded-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone number <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="+91..." className="rounded-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-[1fr_100px] gap-4">
                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="jane@example.com" className="rounded-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qty <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="100" className="rounded-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="customerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery address <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Full street address, city, state, pin code" 
                          className="min-h-[100px] rounded-sm resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any special instructions" className="min-h-[60px] rounded-sm resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 border-t border-border/50 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={handleClose} disabled={createOrder.isPending} className="rounded-sm">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createOrder.isPending} className="rounded-sm min-w-[120px]">
                    {createOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Confirm order
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {step === "success_whatsapp" && (
            <div className="py-8 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl text-primary">Your order is saved!</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                We've opened WhatsApp in a new tab so you can confirm with us directly. 
                Your order reference is <strong>#{createdOrderId}</strong>.
              </p>
              
              {settings?.whatsappNumber && (
                <Button 
                  variant="outline" 
                  className="rounded-sm mt-4"
                  onClick={() => {
                    const msg = `Hi, I'd like to confirm my order #${createdOrderId}.`;
                    window.open(`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open WhatsApp again
                </Button>
              )}
              
              <div className="pt-8">
                <Button onClick={handleClose} className="rounded-sm w-full sm:w-auto">
                  Close and return to catalogue
                </Button>
              </div>
            </div>
          )}

          {step === "success_online" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center shrink-0">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-primary leading-tight">Order #{createdOrderId} saved</h3>
                  <p className="text-sm text-muted-foreground">Please complete your payment using the details below.</p>
                </div>
              </div>

              {settings?.paymentInstructions && (
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-sm text-sm text-primary mb-6">
                  {settings.paymentInstructions}
                </div>
              )}

              <div className="space-y-4">
                {settings?.upiId && (
                  <div className="bg-muted p-4 rounded-sm border border-border/50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">UPI ID</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 -mt-1 -mr-1" 
                        onClick={() => copyToClipboard(settings.upiId!, 'upi')}
                      >
                        {copiedUpi ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <p className="font-medium text-foreground">{settings.upiId}</p>
                  </div>
                )}

                {settings?.bankDetails && (
                  <div className="bg-muted p-4 rounded-sm border border-border/50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Bank Details</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 -mt-1 -mr-1" 
                        onClick={() => copyToClipboard(settings.bankDetails!, 'bank')}
                      >
                        {copiedBank ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <p className="font-medium text-foreground whitespace-pre-line text-sm leading-relaxed">{settings.bankDetails}</p>
                  </div>
                )}
                
                <div className="bg-muted p-4 rounded-sm border border-border/50 mt-4 flex justify-between items-center">
                  <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Amount to pay</span>
                  <span className="font-serif text-lg font-bold text-primary">{formattedPrice}</span>
                </div>
              </div>

              <div className="pt-8 border-t border-border/50">
                <Button onClick={handleClose} className="rounded-sm w-full">
                  I have saved these details
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
