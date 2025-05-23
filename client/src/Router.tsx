import { Switch, Route } from "wouter";
import { useAuth } from "./contexts/AuthContext";

import NotFound from "@/pages/not-found";
import Login from "@/components/auth/Login";
import TOTPVerify from "@/components/auth/TOTPVerify";
import Register from "@/pages/Register";
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

// Admin pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUserManagement from "@/pages/admin/UserManagement";
import AdminCourseOverview from "@/pages/admin/CourseOverview";
import AdminBadgeManagement from "@/pages/admin/BadgeManagement";
import AdminSettings from "@/pages/admin/Settings";

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

export default function AppRouter() {
  const { isAuthenticated, isVerifying, showTOTP } = useAuth();

  if (isVerifying) {
    return <div>Loading...</div>;
  }

  if (showTOTP) {
    return <TOTPVerify />;
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Role-specific dashboards */}
      <PrivateRoute path="/" component={RoleRedirector} />
      
      {/* Student routes */}
      <PrivateRoute path="/student/dashboard" component={StudentDashboard} roles={['student']} />
      <PrivateRoute path="/student/courses" component={StudentCourses} roles={['student']} />
      <PrivateRoute path="/student/courses/:slug" component={StudentCourseDetail} roles={['student']} />
      <PrivateRoute path="/student/assignments" component={StudentAssignments} roles={['student']} />
      <PrivateRoute path="/student/assignments/:id" component={StudentAssignmentSubmit} roles={['student']} />
      <PrivateRoute path="/student/progress" component={StudentProgress} roles={['student']} />
      
      {/* Tutor routes */}
      <PrivateRoute path="/tutor/dashboard" component={TutorDashboard} roles={['tutor']} />
      <PrivateRoute path="/tutor/courses" component={TutorCourseManagement} roles={['tutor']} />
      <PrivateRoute path="/tutor/courses/new" component={TutorCourseEditor} roles={['tutor']} />
      <PrivateRoute path="/tutor/courses/:id/edit" component={TutorCourseEditor} roles={['tutor']} />
      <PrivateRoute path="/tutor/enrollments" component={TutorEnrollmentRequests} roles={['tutor']} />
      <PrivateRoute path="/tutor/assignments" component={TutorAssignmentManagement} roles={['tutor']} />
      <PrivateRoute path="/tutor/assignments/:id/submissions" component={TutorSubmissionReview} roles={['tutor']} />
      <PrivateRoute path="/tutor/analytics" component={TutorAnalytics} roles={['tutor']} />
      
      {/* Admin routes */}
      <PrivateRoute path="/admin/dashboard" component={AdminDashboard} roles={['admin']} />
      <PrivateRoute path="/admin/users" component={AdminUserManagement} roles={['admin']} />
      <PrivateRoute path="/admin/courses" component={AdminCourseOverview} roles={['admin']} />
      <PrivateRoute path="/admin/badges" component={AdminBadgeManagement} roles={['admin']} />
      <PrivateRoute path="/admin/settings" component={AdminSettings} roles={['admin']} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}