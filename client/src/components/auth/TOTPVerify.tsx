import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TOTPVerify() {
  const { verifyTOTP, tempAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [totpCode, setTotpCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  const handleInputChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    if (value.length > 1) {
      // Handle paste events
      const pastedValue = value.slice(0, 6).split('');
      const newCode = [...totpCode];
      
      pastedValue.forEach((char, i) => {
        if (i + index < 6) {
          newCode[i + index] = char;
        }
      });
      
      setTotpCode(newCode);
      
      // Focus next empty input or last input
      const nextEmptyIndex = newCode.findIndex(v => v === '');
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
    } else {
      // Handle single character input
      const newCode = [...totpCode];
      newCode[index] = value;
      setTotpCode(newCode);
      
      // Auto-focus next input
      if (value !== '' && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && totpCode[index] === '' && index > 0) {
      // Focus previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = totpCode.join('');
    
    if (code.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'Please enter all 6 digits of your authentication code.',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await verifyTOTP(code);
      // Redirect is handled in AuthContext after successful verification
    } catch (error) {
      let errorMessage = 'Failed to verify code';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Verification Error',
        description: errorMessage,
      });
      
      // Clear the inputs on error
      setTotpCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  if (!tempAuth) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-100">
      <Card className="max-w-md w-full bg-white rounded-xl shadow-lg">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-primary">Two-Factor Authentication</h1>
            <p className="text-neutral-600 mt-2">Enter the code from your authenticator app</p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="flex space-x-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={totpCode[index]}
                    onChange={(e) => handleInputChange(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleVerify}
              className="w-full bg-primary text-white font-medium py-2 px-4 rounded-lg hover:bg-primary/90 transition"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>

            <div className="text-center text-sm text-neutral-600">
              <span>Didn't receive a code?</span>
              <Button 
                variant="link" 
                onClick={() => {
                  // In a real app, this would request a new code
                  toast({
                    title: 'New code requested',
                    description: 'Please check your authenticator app for the updated code.',
                  });
                }}
                className="text-primary hover:text-primary/90 pl-1"
                disabled={isLoading}
              >
                Resend code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
