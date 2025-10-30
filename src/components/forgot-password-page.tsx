import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Mail } from 'lucide-react';
import { useAdmin } from './admin-context';
import ApiService from '../services/api';
import Group1 from '../imports/Group1-47-1099';

export function ForgotPasswordPage() {
  const { setCurrentPage, setOtpData } = useAdmin();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Ask Supabase to send recovery email (uses your Supabase SMTP)
      await ApiService.supabaseRecover(email, window.location.origin);
      // Store for next step (OTP UI retained if you want to keep the flow uniform)
      setOtpData({ email, purpose: 'forgot-password' });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Forgot password email failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

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