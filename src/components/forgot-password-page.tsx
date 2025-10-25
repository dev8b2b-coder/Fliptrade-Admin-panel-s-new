import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Mail } from 'lucide-react';
import { useAdmin } from './admin-context';
import Group1 from '../imports/Group1-47-1099';
import { toast } from 'sonner';

export function ForgotPasswordPage() {
  const { setCurrentPage, setOtpData } = useAdmin();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    
    // Simulate API call
    setTimeout(() => {
      setOtpData({ email, purpose: 'forgot-password' });
      setIsSubmitted(false);
      setIsLoading(false);
    }, 1000);
  };


  /**
 * Request a password-reset OTP for the given email.
 */
   async function handleReset(email = null) {
    
    const Server = import.meta.env.VITE_NODE_SERVER;
  
    if (!email) {
      
      console.warn("[handleReset] No email provided.");
      toast.error("Please enter your email.");
      return { error: "Email is required." };
    }
  
    if (!Server) {
      console.error("[handleReset] Missing VITE_NODE_SERVER env variable.");
      toast.error("Server configuration missing.");
      return { error: "Server URL not configured." };
    }
  
    try {
      localStorage.setItem("email",email)
      console.log("[handleReset]  Sending OTP request:", {
        endpoint: `${Server}/v1/otp/request`,
        email,
      });
  
      const response = await fetch(`${Server}/v1/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
  
      console.log("[handleReset]  Raw response status:", response.status);
  
      const data = await response.json();
  
      if (!response.ok) {
        console.warn("[handleReset]  Server responded with error:", data);
        toast.error(data?.error || "Failed to send OTP. Please try again.");
        return { error: data?.error || "Failed to send OTP." };
      }
  
      console.log("[handleReset]  OTP request successful:", data);
      localStorage.setItem("otp_expires_at", String(Date.now() + 60_000));
     
      toast.success(data?.message || "OTP sent successfully!");

      
      

      setCurrentPage('otp-verification');
      return data;
    } catch (error) {
      console.error("[handleReset]  Request failed:", error);
      toast.error("Network error while requesting OTP.");
      return { error: "Network error while requesting OTP." };
    }
  }



  const handleContinue = () => {
    setCurrentPage('otp-verification');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6a40ec] to-[#8b5cf6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-md bg-white/95 shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="w-56 h-16 flex items-center justify-center">
                <Group1 />
              </div>
            </div>
            <CardTitle className="text-2xl text-gray-800">Reset Password</CardTitle>
            <CardDescription className="text-gray-600">
              {isSubmitted 
                ? 'Check your email for reset instructions'
                : 'Enter your email to receive reset instructions'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="mt-1"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#6a40ec] hover:bg-[#5a2fd9] text-white border border-[#6a40ec]"
                  disabled={isLoading}
                  onClick={() =>{ handleReset(email)
                    console.log("handleReset() Clicked");
                    
                  }}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setCurrentPage('login')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-[#6a40ec]/10 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-[#6a40ec]" />
                </div>
                <p className="text-gray-600">
                  We've sent a verification code to <strong>{email}</strong>
                </p>
                <Button
                  onClick={handleContinue}
                  className="w-full bg-[#6a40ec] hover:bg-[#5a2fd9] text-white border border-[#6a40ec]"
                >
                  Enter Verification Code
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setCurrentPage('login')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}