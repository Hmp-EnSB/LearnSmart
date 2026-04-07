import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useLocation } from "wouter";

// Import components
import NotFound from "@/pages/not-found";
import TOTPVerify from "@/components/auth/TOTPVerify";
import Register from "@/pages/Register";
import WelcomePage from "./pages/WelcomePage";
import RoleRedirector from "@/components/RoleRedirector";

// Student pages
import StudentDashboard from "@/pages/student/Dashboard";
import StudentCourses from "@/pages/student/Courses";
import StudentCourseDetail from "@/pages/student/CourseDetail";
import StudentAssignments from "@/pages/student/Assignments";
import StudentAssignmentSubmit from "@/pages/student/AssignmentSubmit";
import StudentProgress from "@/pages/student/Progress";

// Tutor pages
import TutorDashboard from "@/pages/tutor/Dashboard";
import TutorCourseManagement from "@/pages/tutor/CourseManagement";
import TutorCourseEditor from "@/pages/tutor/CourseEditor";
import TutorEnrollmentRequests from "@/pages/tutor/EnrollmentRequests";
import TutorAssignmentManagement from "@/pages/tutor/AssignmentManagement";
import TutorSubmissionReview from "@/pages/tutor/SubmissionReview";
import TutorAnalytics from "@/pages/tutor/Analytics";
// Add this import at the top with your other imports
import CourseModules from "@/pages/tutor/CourseModules";
// Admin pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUserManagement from "@/pages/admin/UserManagement";
import AdminCourseOverview from "@/pages/admin/CourseOverview";
import AdminBadgeManagement from "@/pages/admin/BadgeManagement";
import AdminSettings from "@/pages/admin/Settings";

// Login Component
function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err) {
      setError("Failed to login. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Learn Smart</h1>
          <p className="text-neutral-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white font-medium py-2 px-4 rounded-lg hover:bg-primary/90 transition"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

          <div className="text-center text-sm text-neutral-600 mt-4">
            <span>Don't have an account?</span>
            <button
              type="button"
              onClick={() => setLocation("/register")}
              className="text-primary hover:text-primary/90 pl-1"
            >
              Register here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// PrivateRoute Component
function PrivateRoute({ component: Component, roles, ...rest }: any) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Route path={rest.path} component={Login} />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Route path={rest.path} component={RoleRedirector} />;
  }

  return <Route path={rest.path} component={Component} />;
}

// Main Router
function AppRouter() {
  const { isVerifying, showTOTP } = useAuth();

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-medium">Loading...</p>
          <p className="text-gray-500 mt-2">
            Please wait while we authenticate you.
          </p>
        </div>
      </div>
    );
  }

  if (showTOTP) {
    return <TOTPVerify />;
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={WelcomePage} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Role-specific dashboards */}
      <PrivateRoute path="/dashboard" component={RoleRedirector} />

      {/* Student routes */}
      <PrivateRoute
        path="/student/dashboard"
        component={StudentDashboard}
        roles={["student"]}
      />
      <PrivateRoute
        path="/student/courses"
        component={StudentCourses}
        roles={["student"]}
      />
      <PrivateRoute
        path="/student/courses/:slug"
        component={StudentCourseDetail}
        roles={["student"]}
      />
      <PrivateRoute
        path="/student/assignments"
        component={StudentAssignments}
        roles={["student"]}
      />
      <PrivateRoute
        path="/student/assignments/:id"
        component={StudentAssignmentSubmit}
        roles={["student"]}
      />
      <PrivateRoute
        path="/student/progress"
        component={StudentProgress}
        roles={["student"]}
      />

      {/* Tutor routes */}
      <PrivateRoute
        path="/tutor/dashboard"
        component={TutorDashboard}
        roles={["tutor"]}
      />
      <PrivateRoute
        path="/tutor/courses"
        component={TutorCourseManagement}
        roles={["tutor"]}
      />
      <PrivateRoute
        path="/tutor/courses/new"
        component={TutorCourseEditor}
        roles={["tutor"]}
      />
      <PrivateRoute
        path="/tutor/courses/:id/edit"
        component={TutorCourseEditor}
        roles={["tutor"]}
      />
      {/* Add the new CourseModules route here */}
      <PrivateRoute
        path="/tutor/courses/:slug/modules"
        component={CourseModules}
        roles={["tutor"]}
      />
      <PrivateRoute
        path="/tutor/enrollments"
        component={TutorEnrollmentRequests}
        roles={["tutor"]}
      />
      <PrivateRoute
        path="/tutor/assignments"
        component={TutorAssignmentManagement}
        roles={["tutor"]}
      />
      <PrivateRoute
        path="/tutor/assignments/:id/submissions"
        component={TutorSubmissionReview}
        roles={["tutor"]}
      />
      <PrivateRoute
        path="/tutor/analytics"
        component={TutorAnalytics}
        roles={["tutor"]}
      />
      {/* Admin routes */}
      <PrivateRoute
        path="/admin/dashboard"
        component={AdminDashboard}
        roles={["admin"]}
      />
      <PrivateRoute
        path="/admin/users"
        component={AdminUserManagement}
        roles={["admin"]}
      />
      <PrivateRoute
        path="/admin/courses"
        component={AdminCourseOverview}
        roles={["admin"]}
      />
      <PrivateRoute
        path="/admin/badges"
        component={AdminBadgeManagement}
        roles={["admin"]}
      />
      <PrivateRoute
        path="/admin/settings"
        component={AdminSettings}
        roles={["admin"]}
      />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Main App Component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AppRouter />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
