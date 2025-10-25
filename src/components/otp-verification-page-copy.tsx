import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { ArrowLeft, Shield } from 'lucide-react';
import { useAdmin } from './admin-context';
import Group1 from '../imports/Group1-47-1099';
import { toast } from "sonner";
export function OTPVerificationPage() {
  const { setCurrentPage, otpData } = useAdmin();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      if (otpData?.purpose === 'forgot-password') {
        setCurrentPage('change-password');
      } else {
        setCurrentPage('dashboard');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    // Simulate API call
    setTimeout(() => {
      setIsResending(false);
    }, 2000);
  };
  

  async function handleOtpVerify(email, code) {
    console.log("verify the code");
    
    const Server = import.meta.env.VITE_NODE_SERVER;
  console.log("server ",Server);
  
    if (!Server) {
      console.error("[handleOtpVerify] Missing VITE_NODE_SERVER env variable.");
      toast.error("Server configuration missing.");
      return { error: "Server URL not configured." };
    }
  
    if (!email || !code) {
      console.warn("[handleOtpVerify] Missing email or code.");
      toast.error("Please enter both email and OTP code.");
      return { error: "Email and code are required." };
    }
  
    try {
      console.log("[handleOtpVerify] Sending verification request:", {
        endpoint: `${Server}/v1/otp/verify`,
        email,
        code,
      });
  
      const response = await fetch(`${Server}/v1/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
  
      console.log("[handleOtpVerify] Response status:", response.status);
      const data = await response.json();
  
      if (!response.ok) {
        console.warn("[handleOtpVerify] Verification failed:", data);
        toast.error(data?.error || "Invalid or expired OTP.");
        return { error: data?.error || "Invalid or expired OTP." };
      }
  
      console.log("[handleOtpVerify] OTP verified successfully:", data);
      toast.success("OTP verified successfully!");
      return data;
    } catch (error) {
      console.error("[handleOtpVerify]  Request failed:", error);
      toast.error("Network error while verifying OTP.");
      return { error: "Network error while verifying OTP." };
    }
  }

  const email=localStorage.getItem('email');
  const handleBack = () => {
    if (otpData?.purpose === 'forgot-password') {
      setCurrentPage('forgot-password');
    } else {
      setCurrentPage('login');
    }
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
            <CardTitle className="text-2xl text-gray-800">Verify Your Email</CardTitle>
            
            <CardDescription className="text-gray-600">
              Enter the 6-digit code sent to {otpData?.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="w-16 h-16 bg-[#6a40ec]/10 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-[#6a40ec]" />
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#6a40ec] hover:bg-[#5a2fd9] text-white border border-[#6a40ec]"
                  disabled={isLoading || otp.length !== 6}
                  onClick={(()=>{
                    
                    handleOtpVerify(email,otp)
                    console.log("verify click on ui");
                    
                  })}
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </Button>
              </form>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">Didn't receive the code?</p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOTP}
                  disabled={isResending}
                  className="text-[#6a40ec] hover:text-[#5a2fd9]"
                >
                  {isResending ? 'Sending...' : 'Resend Code'}
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}