import { useState } from 'react';
import { useAuth } from '../../App';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(values.username, values.password);
      // Login handled in AuthContext with TOTP redirect
    } catch (error) {
      let errorMessage = 'Failed to log in';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-100">
      <Card className="max-w-md w-full bg-white rounded-xl shadow-lg">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-primary">Learn Smart</h1>
            <p className="text-neutral-600 mt-2">Sign in to your account</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-neutral-700">Username</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your username"
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-neutral-700">Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-primary text-white font-medium py-2 px-4 rounded-lg hover:bg-primary/90 transition"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>

              <div className="text-center text-sm text-neutral-600 mt-4">
                <span>Don't have an account?</span>
                <Button 
                  variant="link" 
                  onClick={() => setLocation('/register')}
                  className="text-primary hover:text-primary/90 pl-1"
                >
                  Register here
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
