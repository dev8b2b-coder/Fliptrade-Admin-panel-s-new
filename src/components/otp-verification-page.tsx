import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { ArrowLeft, Shield } from 'lucide-react';
import { useAdmin } from './admin-context';
import Group1 from '../imports/Group1-47-1099';

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