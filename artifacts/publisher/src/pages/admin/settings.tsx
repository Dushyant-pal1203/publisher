import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const settingsSchema = z.object({
  publisherName: z.string().min(1, "Publisher name is required"),
  tagline: z.string().nullable().optional(),
  about: z.string().nullable().optional(),
  whatsappNumber: z.string().min(5, "WhatsApp number is required"),
  contactEmail: z.string().email("Valid email is required").nullable().optional().or(z.literal('')),
  contactAddress: z.string().nullable().optional(),
  currency: z.string().min(1, "Currency is required"),
  upiId: z.string().nullable().optional(),
  bankDetails: z.string().nullable().optional(),
  paymentInstructions: z.string().nullable().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminSettings() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      publisherName: "",
      tagline: "",
      about: "",
      whatsappNumber: "",
      contactEmail: "",
      contactAddress: "",
      currency: "INR",
      upiId: "",
      bankDetails: "",
      paymentInstructions: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        publisherName: settings.publisherName,
        tagline: settings.tagline || "",
        about: settings.about || "",
        whatsappNumber: settings.whatsappNumber,
        contactEmail: settings.contactEmail || "",
        contactAddress: settings.contactAddress || "",
        currency: settings.currency || "INR",
        upiId: settings.upiId || "",
        bankDetails: settings.bankDetails || "",
        paymentInstructions: settings.paymentInstructions || "",
      });
    }
  }, [settings, form]);

  const onSubmit = (values: SettingsFormValues) => {
    updateSettings.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          toast({ title: "Settings updated successfully" });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to update settings" });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <h1 className="font-serif text-3xl">Settings</h1>
        </div>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/50 pb-4 gap-4">
        <h1 className="font-serif text-3xl">Settings</h1>
        <Button 
          onClick={form.handleSubmit(onSubmit)} 
          disabled={updateSettings.isPending}
          className="rounded-sm"
        >
          {updateSettings.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="space-y-4">
            <h2 className="font-serif text-xl text-primary">Store Identity</h2>
            <Card className="rounded-sm border-border/50">
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="publisherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Publisher Name</FormLabel>
                        <FormControl><Input className="rounded-sm" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency Code</FormLabel>
                        <FormControl><Input className="rounded-sm" {...field} /></FormControl>
                        <FormDescription>Standard ISO 3-letter code (e.g. INR, USD)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="tagline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tagline</FormLabel>
                      <FormControl><Input className="rounded-sm" {...field} value={field.value || ""} /></FormControl>
                      <FormDescription>A short sentence describing your publishing house.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="about"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About</FormLabel>
                      <FormControl><Textarea className="rounded-sm min-h-[120px]" {...field} value={field.value || ""} /></FormControl>
                      <FormDescription>Displayed on the About page. Multiple paragraphs supported.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl text-primary">Contact & Support</h2>
            <Card className="rounded-sm border-border/50">
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number</FormLabel>
                        <FormControl><Input className="rounded-sm" {...field} /></FormControl>
                        <FormDescription>International format with country code, no plus sign (e.g. 919876543210)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl><Input type="email" className="rounded-sm" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="contactAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical Address</FormLabel>
                      <FormControl><Textarea className="rounded-sm min-h-[80px]" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl text-primary">Payment Details</h2>
            <Card className="rounded-sm border-border/50">
              <CardContent className="p-6 space-y-6">
                <FormField
                  control={form.control}
                  name="paymentInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>General Payment Instructions</FormLabel>
                      <FormControl><Textarea className="rounded-sm min-h-[80px]" {...field} value={field.value || ""} /></FormControl>
                      <FormDescription>Shown to customers when they place an online order.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="upiId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UPI ID</FormLabel>
                        <FormControl><Input className="rounded-sm" placeholder="store@upi" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Details</FormLabel>
                        <FormControl><Textarea className="rounded-sm min-h-[100px]" placeholder="Bank Name:&#10;Account Name:&#10;Account No:&#10;IFSC:" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

        </form>
      </Form>
    </div>
  );
}