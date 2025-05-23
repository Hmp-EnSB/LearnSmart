import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

export default function RoleRedirector() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'student':
          setLocation('/student/dashboard');
          break;
        case 'tutor':
          setLocation('/tutor/dashboard');
          break;
        case 'admin':
          setLocation('/admin/dashboard');
          break;
        default:
          setLocation('/login');
      }
    } else {
      setLocation('/login');
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-100">
      <div className="text-center">
        <h2 className="text-xl font-medium text-neutral-800 mb-2">Redirecting...</h2>
        <p className="text-neutral-600">Please wait while we redirect you to the appropriate dashboard.</p>
      </div>
    </div>
  );
}
