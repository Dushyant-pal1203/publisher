import { useGetSettings } from "@workspace/api-client-react";
import { Mail, MapPin, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function About() {
  const { data: settings, isLoading } = useGetSettings();

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Skeleton className="h-12 w-2/3 mb-6" />
        <Skeleton className="h-6 w-full mb-12" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
      <div className="text-center mb-16">
        <h1 className="font-serif text-4xl md:text-5xl text-primary leading-tight mb-4">
          {settings?.publisherName || "My Publishing House"}
        </h1>
        <p className="text-xl text-muted-foreground font-light italic font-serif">
          {settings?.tagline || "Independent publisher of thoughtful literature."}
        </p>
      </div>

      {settings?.about && (
        <div className="prose prose-stone dark:prose-invert max-w-none mb-16 text-muted-foreground font-light leading-relaxed md:text-lg">
          {settings.about.split('\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      )}

      <div className="border-t border-border/50 pt-12">
        <h2 className="font-serif text-2xl mb-8 text-center">Contact Us</h2>
        
        <div className="grid sm:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-4">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-medium mb-1">Email</h3>
            <p className="text-sm text-muted-foreground">
              {settings?.contactEmail ? (
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-primary transition-colors">
                  {settings.contactEmail}
                </a>
              ) : "Not provided"}
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-4">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-medium mb-1">WhatsApp</h3>
            <p className="text-sm text-muted-foreground">
              {settings?.whatsappNumber ? (
                <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  +{settings.whatsappNumber}
                </a>
              ) : "Not provided"}
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-4">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-medium mb-1">Address</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {settings?.contactAddress || "Not provided"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
