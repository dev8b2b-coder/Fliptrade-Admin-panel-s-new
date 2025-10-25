import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { ArrowLeft, Shield } from 'lucide-react';
import { useAdmin } from './admin-context';
import Group1 from '../imports/Group1-47-1099';
import { toast } from 'sonner';

export function OTPVerificationPage() {
  const { setCurrentPage, otpData } = useAdmin();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null as ReturnType<typeof setInterval> | null);

  const Server = import.meta.env.VITE_NODE_SERVER;
  const emailFromContext = otpData?.email?.trim().toLowerCase();
  const emailFromStorage = (localStorage.getItem('email') || '').trim().toLowerCase();
  const email = useMemo(() => emailFromContext || emailFromStorage, [emailFromContext, emailFromStorage]);

  // ---- start / restore countdown from localStorage ----
  useEffect(() => {
    const expStr = localStorage.getItem('otp_expires_at');
    const expMs = expStr ? Number(expStr) : 0;
    const now = Date.now();
    const initial = expMs > now ? Math.ceil((expMs - now) / 1000) : 0;
    setSecondsLeft(initial);

    if (initial > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function verifyOtp(emailArg: string, code: string) {
    if (!Server) {
      toast.error('Server configuration missing.');
      return { error: 'Server URL not configured.' };
    }
    if (!emailArg || !code) {
      toast.error('Please enter both email and OTP code.');
      return { error: 'Email and code are required.' };
    }

    try {
      const res = await fetch(`${Server}/v1/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailArg, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Invalid or expired OTP.');
        return { error: data?.error || 'Invalid or expired OTP.' };
      }
      toast.success('OTP verified successfully!');
      return data; // { ok: true }
    } catch (e) {
      console.error('[verifyOtp] failed:', e);
      toast.error('Network error while verifying OTP.');
      return { error: 'Network error while verifying OTP.' };
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit OTP.');
      return;
    }
    setIsLoading(true);
    const result = await verifyOtp(email, otp);
    setIsLoading(false);

    if (!result?.error) {
      // stop timer + clear expiry + go next
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      localStorage.removeItem('otp_expires_at');
      setCurrentPage('change-password');
    }
  };

  const handleResendOTP = async () => {
    if (secondsLeft > 0) return; // safety
    if (!email) {
      toast.error('No email found. Please go back and request OTP again.');
      return;
    }
    if (!Server) {
      toast.error('Server configuration missing.');
      return;
    }
    setIsResending(true);
    try {
      const res = await fetch(`${Server}/v1/otp/request/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Failed to resend OTP.');
        setIsResending(false);
        return;
      }
      toast.success(data?.message || 'OTP resent!');

      // restart 60s window and countdown
      const newExp = Date.now() + 60_000;
      localStorage.setItem('otp_expires_at', String(newExp));
      setSecondsLeft(60);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      console.error('[handleResendOTP] failed:', e);
      toast.error('Network error while resending OTP.');
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => setCurrentPage('forgot-password');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6a40ec] to-[#8b5cf6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-md bg-white/95 shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-56 h-16 flex items-center justify-center">
                <Group1 />
              </div>
            </div>
            <CardTitle className="text-2xl text-gray-800">Verify Your Email</CardTitle>
            <CardDescription className="text-gray-600">
              Enter the 6-digit code sent to {email || otpData?.email}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              <div className="w-16 h-16 bg-[#6a40ec]/10 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-[#6a40ec]" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
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
                <p className="text-sm text-gray-600">
                  {secondsLeft > 0
                    ? `You can resend a new code in ${secondsLeft}s`
                    : "Didn't receive the code?"}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOTP}
                  disabled={isResending || secondsLeft > 0}
                  className="text-[#6a40ec] hover:text-[#5a2fd9]"
                >
                  {isResending ? 'Sending...' : 'Resend Code'}
                </Button>
              </div>

              <Button type="button" variant="ghost" className="w-full" onClick={handleBack}>
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
