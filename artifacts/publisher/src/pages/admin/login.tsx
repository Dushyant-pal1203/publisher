import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, Github, Loader2 } from "lucide-react";
import { OTPInput } from "@/components/ui/otp-input";

const SimplePhoneInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  return (
    <Input
      type="tel"
      placeholder="+91 9876543210"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-sm"
    />
  );
};

export default function AdminLogin() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone login state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Registration state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");

  useEffect(() => {
    // Check if any admin exists
    const checkAdmin = async () => {
      try {
        const response = await fetch("/api/admin-auth/check", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Admin check response:", data);
        setHasAdmin(data.hasAdmin === true);
      } catch (error) {
        console.error("Error checking admin:", error);
        // If there's an error, assume no admin exists to show registration form
        setHasAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin-auth/login/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({ title: "Login successful!" });
        window.location.href = "/admin";
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: data.error || "Invalid credentials",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Network error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      toast({ variant: "destructive", title: "Please enter phone number" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin-auth/login/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
        credentials: "include",
      });

      if (response.ok) {
        setOtpSent(true);
        setResendTimer(60);
        toast({
          title: "OTP sent successfully!",
          description: "Check the server console for the OTP code.",
        });
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Failed to send OTP",
          description: data.error,
        });
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      toast({ variant: "destructive", title: "Failed to send OTP" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({ variant: "destructive", title: "Please enter 6-digit OTP" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin-auth/login/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({ title: "Login successful!" });
        window.location.href = "/admin";
      } else {
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: data.error,
        });
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      toast({ variant: "destructive", title: "Verification failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin-auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          firstName: regFirstName,
          lastName: regLastName,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({ title: "Admin account created successfully!" });
        window.location.href = "/admin";
      } else {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: data.error || "Please try again",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({ variant: "destructive", title: "Registration failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/admin-auth/google";
  };

  // Show loading state
  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Show registration form if no admin exists
  if (!hasAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-center">
              Create Admin Account
            </CardTitle>
            <CardDescription className="text-center">
              Set up your first administrator account to manage the publisher
              dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    required
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    required
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Admin Account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login form if admin exists
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-serif">Admin Login</CardTitle>
          <CardDescription>Access the publisher dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone (OTP)</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  <Mail className="w-4 h-4 mr-2" />
                  Login with Email
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone">
              <div className="space-y-4">
                {!otpSent ? (
                  <>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <SimplePhoneInput
                        value={phoneNumber}
                        onChange={setPhoneNumber}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter with country code (e.g., +919876543210)
                      </p>
                    </div>
                    <Button
                      onClick={handleSendOTP}
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      <Phone className="w-4 h-4 mr-2" />
                      Send OTP
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <Label>Enter OTP</Label>
                      <div className="flex justify-center my-4">
                        <OTPInput
                          value={otp}
                          onChange={setOtp}
                          numInputs={6}
                          renderSeparator={<span className="mx-1">-</span>}
                          inputStyle="w-12 h-12 text-center border rounded-md mx-1"
                          inputType="number"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleVerifyOTP}
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Verify & Login
                    </Button>
                    {resendTimer === 0 ? (
                      <Button
                        variant="ghost"
                        onClick={handleSendOTP}
                        className="w-full"
                      >
                        Resend OTP
                      </Button>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground">
                        Resend OTP in {resendTimer} seconds
                      </p>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <Github className="w-4 h-4 mr-2" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
