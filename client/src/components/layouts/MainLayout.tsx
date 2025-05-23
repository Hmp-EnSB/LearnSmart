import { useState, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Home, Book, ClipboardList, BarChart3, Users, Award, Settings, User, LogOut, Menu, Moon, Sun
} from 'lucide-react';

type NavLinkProps = {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  currentPath: string;
};

function NavLink({ href, icon, children, currentPath }: NavLinkProps) {
  const isActive = currentPath === href;
  
  return (
    <Link href={href}>
      <a className={`flex items-center px-3 py-2 rounded-lg transition ${isActive 
        ? 'bg-primary/10 text-primary' 
        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}>
        <span className="mr-3">{icon}</span>
        {children}
      </a>
    </Link>
  );
}

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function MainLayout({ children, title }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const [currentPath] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useMobile();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
  };

  // Define navigation links based on user role
  const renderNavLinks = () => {
    if (!user) return null;

    switch (user.role) {
      case 'student':
        return (
          <>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 my-2 dark:text-neutral-400">
              Student Dashboard
            </h3>
            <NavLink href="/student/dashboard" icon={<Home size={18} />} currentPath={currentPath}>
              Home
            </NavLink>
            <NavLink href="/student/courses" icon={<Book size={18} />} currentPath={currentPath}>
              My Courses
            </NavLink>
            <NavLink href="/student/assignments" icon={<ClipboardList size={18} />} currentPath={currentPath}>
              Assignments
            </NavLink>
            <NavLink href="/student/progress" icon={<BarChart3 size={18} />} currentPath={currentPath}>
              Progress
            </NavLink>
          </>
        );
      case 'tutor':
        return (
          <>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 my-2 dark:text-neutral-400">
              Tutor Dashboard
            </h3>
            <NavLink href="/tutor/dashboard" icon={<Home size={18} />} currentPath={currentPath}>
              Home
            </NavLink>
            <NavLink href="/tutor/courses" icon={<Book size={18} />} currentPath={currentPath}>
              My Courses
            </NavLink>
            <NavLink href="/tutor/enrollments" icon={<Users size={18} />} currentPath={currentPath}>
              Enrollments
            </NavLink>
            <NavLink href="/tutor/assignments" icon={<ClipboardList size={18} />} currentPath={currentPath}>
              Assignments
            </NavLink>
            <NavLink href="/tutor/analytics" icon={<BarChart3 size={18} />} currentPath={currentPath}>
              Analytics
            </NavLink>
          </>
        );
      case 'admin':
        return (
          <>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 my-2 dark:text-neutral-400">
              Admin Dashboard
            </h3>
            <NavLink href="/admin/dashboard" icon={<Home size={18} />} currentPath={currentPath}>
              Dashboard
            </NavLink>
            <NavLink href="/admin/users" icon={<Users size={18} />} currentPath={currentPath}>
              Users
            </NavLink>
            <NavLink href="/admin/courses" icon={<Book size={18} />} currentPath={currentPath}>
              Courses
            </NavLink>
            <NavLink href="/admin/badges" icon={<Award size={18} />} currentPath={currentPath}>
              Badges
            </NavLink>
            <NavLink href="/admin/settings" icon={<Settings size={18} />} currentPath={currentPath}>
              Settings
            </NavLink>
          </>
        );
      default:
        return null;
    }
  };

  const SidebarContent = () => (
    <div className="space-y-1">
      {renderNavLinks()}
      
      <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="px-3 py-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <User size={16} />
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{user?.fullName}</p>
              <p className="text-xs text-neutral-500 capitalize dark:text-neutral-400">{user?.role}</p>
            </div>
          </div>
        </div>
        
        <div className="flex px-3 mt-2 space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-neutral-600 dark:text-neutral-300"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span className="ml-2">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-neutral-600 dark:text-neutral-300"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span className="ml-2">Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen w-full bg-neutral-100 dark:bg-neutral-900">
      {/* Desktop Sidebar */}
      <aside className="fixed h-full w-64 bg-white shadow-md hidden lg:block dark:bg-neutral-800 dark:border-r dark:border-neutral-700">
        <div className="p-6">
          <h1 className="text-2xl font-heading font-bold text-primary">Learn Smart</h1>
        </div>
        <nav className="mt-4 px-4">
          <SidebarContent />
        </nav>
      </aside>

      {/* Mobile Header */}
      <header className="bg-white shadow-sm lg:hidden dark:bg-neutral-800 dark:border-b dark:border-neutral-700">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-heading font-bold text-primary">Learn Smart</h1>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
            
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[280px] sm:w-[350px]">
                <div className="py-6">
                  <h2 className="text-lg font-bold text-primary mb-6">Learn Smart</h2>
                  <SidebarContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-6">
        {title && (
          <header className="mb-6">
            <h1 className="text-2xl font-heading font-semibold text-neutral-800 dark:text-neutral-100">{title}</h1>
          </header>
        )}
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 w-full bg-white border-t border-neutral-200 h-16 flex items-center justify-around lg:hidden dark:bg-neutral-800 dark:border-neutral-700">
          {user?.role === 'student' && (
            <>
              <Link href="/student/dashboard">
                <a className={`flex flex-col items-center justify-center ${currentPath === '/student/dashboard' ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  <Home size={20} />
                  <span className="text-xs mt-1">Home</span>
                </a>
              </Link>
              <Link href="/student/courses">
                <a className={`flex flex-col items-center justify-center ${currentPath === '/student/courses' ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  <Book size={20} />
                  <span className="text-xs mt-1">Courses</span>
                </a>
              </Link>
              <Link href="/student/assignments">
                <a className={`flex flex-col items-center justify-center ${currentPath === '/student/assignments' ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  <ClipboardList size={20} />
                  <span className="text-xs mt-1">Assignments</span>
                </a>
              </Link>
              <Link href="/student/progress">
                <a className={`flex flex-col items-center justify-center ${currentPath === '/student/progress' ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  <User size={20} />
                  <span className="text-xs mt-1">Profile</span>
                </a>
              </Link>
            </>
          )}
          
          {user?.role === 'tutor' && (
            <>
              <Link href="/tutor/dashboard">
                <a className={`flex flex-col items-center justify-center ${currentPath === '/tutor/dashboard' ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  <Home size={20} />
                  <span className="text-xs mt-1">Home</span>
                </a>
              </Link>
              <Link href="/tutor/courses">
                <a className={`flex flex-col items-center justify-center ${currentPath === '/tutor/courses' ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  <Book size={20} />
                  <span className="text-xs mt-1">Courses</span>
                </a>
              </Link>
              <Link href="/tutor/enrollments">
                <a className={`flex flex-col items-center justify-center ${currentPath === '/tutor/enrollments' ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  <Users size={20} />
                  <span className="text-xs mt-1">Enrollments</span>
                </a>
              </Link>
              <Link href="/tutor/assignments">
                <a className={`flex flex-col items-center justify-center ${currentPath === '/tutor/assignments' ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  <ClipboardList size={20} />
                  <span className="text-xs mt-1">Assignments</span>
                </a>
              </Link>
            </>
          )}
          
          {user?.role === 'admin' && (
            <>
              <Link href="/admin/dashboard">
                <a className={`flex flex-col items-center justify-center ${currentPath === '/admin/dashboard' ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  <Home size={20} />
                  <span className="text-xs mt-1">Home</span>
                </a>
              </Link>
              <Link href="/admin/users">
                <a className={`flex flex-col items-center justify-center ${currentPath === '/admin/users' ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  <Users size={20} />
                  <span className="text-xs mt-1">Users</span>
                </a>
              </Link>
              <Link href="/admin/courses">
                <a className={`flex flex-col items-center justify-center ${currentPath === '/admin/courses' ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  <Book size={20} />
                  <span className="text-xs mt-1">Courses</span>
                </a>
              </Link>
              <Link href="/admin/settings">
                <a className={`flex flex-col items-center justify-center ${currentPath === '/admin/settings' ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  <Settings size={20} />
                  <span className="text-xs mt-1">Settings</span>
                </a>
              </Link>
            </>
          )}
        </nav>
      )}
    </div>
  );
}
