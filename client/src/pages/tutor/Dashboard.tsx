import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import {
  Book,
  Users,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Settings,
  FileText,
  Video,
  Image,
  File,
  ExternalLink,
  TrendingUp,
  Calendar,
  Clock,
} from "lucide-react";

interface TutorAnalytics {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  activeEnrollments: number;
  pendingEnrollments: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  courseStatistics: CourseStatistic[];
}

interface CourseStatistic {
  id: number;
  title: string;
  slug: string;
  enrollments: number;
  activeStudents: number;
  submissions: number;
  isPublished: boolean;
  _count: {
    modules: number;
  };
}

interface PendingEnrollment {
  id: number;
  status: string;
  enrolledAt: string;
  student: {
    id: number;
    fullName: string;
    email: string;
  };
  course: {
    id: number;
    title: string;
    slug: string;
  };
}

interface RecentActivity {
  id: number;
  type: "enrollment" | "submission" | "module_created" | "course_published";
  message: string;
  timestamp: string;
  course?: {
    title: string;
    slug: string;
  };
}

export default function TutorDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<TutorAnalytics | null>(null);
  const [pendingEnrollments, setPendingEnrollments] = useState<
    PendingEnrollment[]
  >([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Fetch tutor analytics
  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["/api/analytics/tutor"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/tutor", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      return response.json();
    },
  });

  // Fetch pending enrollments specifically
  const {
    data: enrollmentsData,
    isLoading: loadingEnrollments,
    refetch: refetchEnrollments,
  } = useQuery<PendingEnrollment[]>({
    queryKey: ["/api/enrollments?status=pending&tutor=me"],
    queryFn: async () => {
      const response = await fetch("/api/enrollments?status=pending&tutor=me", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch enrollments");
      }
      return response.json();
    },
  });

  // Fetch recent activity
  const { data: activityData, isLoading: loadingActivity } = useQuery<
    RecentActivity[]
  >({
    queryKey: ["/api/analytics/tutor/activity"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/tutor/activity", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch activity");
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (analyticsData) {
      setAnalytics(analyticsData);
    }
  }, [analyticsData]);

  useEffect(() => {
    if (enrollmentsData && Array.isArray(enrollmentsData)) {
      setPendingEnrollments(enrollmentsData);
    }
  }, [enrollmentsData]);

  useEffect(() => {
    if (activityData && Array.isArray(activityData)) {
      setRecentActivity(activityData);
    }
  }, [activityData]);

  const handleEnrollmentAction = async (
    enrollmentId: number,
    action: "approve" | "reject",
  ) => {
    try {
      const response = await fetch(
        `/api/enrollments/${enrollmentId}/${action}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (response.ok) {
        // Remove from pending list
        setPendingEnrollments((prev) =>
          prev.filter((enrollment) => enrollment.id !== enrollmentId),
        );
        // Refetch data
        refetchEnrollments();
        // Show success message
        console.log(`Enrollment ${action}d successfully`);
      } else {
        const error = await response.json();
        console.error(`Failed to ${action} enrollment:`, error.message);
        alert(`Failed to ${action} enrollment: ${error.message}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing enrollment:`, error);
      alert(`Error ${action}ing enrollment. Please try again.`);
    }
  };

  const getModuleTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-3 w-3" />;
      case "image":
        return <Image className="h-3 w-3" />;
      case "file":
        return <File className="h-3 w-3" />;
      case "link":
        return <ExternalLink className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "enrollment":
        return <Users className="h-4 w-4 text-blue-600" />;
      case "submission":
        return <ClipboardList className="h-4 w-4 text-green-600" />;
      case "module_created":
        return <FileText className="h-4 w-4 text-purple-600" />;
      case "course_published":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const isLoading = loadingAnalytics || loadingEnrollments;

  return (
    <MainLayout title="Tutor Dashboard">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-200">
              Welcome back, {user?.fullName}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Here's what's happening with your courses today
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/tutor/courses/new">
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                New Course
              </Button>
            </Link>
            <Link href="/tutor/analytics">
              <Button variant="outline" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Analytics
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-semibold text-neutral-800 dark:text-neutral-200">
                    Total Courses
                  </h2>
                  <p className="text-3xl font-bold text-primary mt-2">
                    {isLoading ? "-" : analytics?.totalCourses || 0}
                  </p>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {isLoading ? "-" : analytics?.publishedCourses || 0}
                    </span>{" "}
                    published
                  </div>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Book className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-semibold text-neutral-800 dark:text-neutral-200">
                    Active Students
                  </h2>
                  <p className="text-3xl font-bold text-primary mt-2">
                    {isLoading ? "-" : analytics?.totalStudents || 0}
                  </p>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Across all courses
                  </div>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-semibold text-neutral-800 dark:text-neutral-200">
                    Pending Requests
                  </h2>
                  <p className="text-3xl font-bold text-orange-500 mt-2">
                    {isLoading ? "-" : pendingEnrollments.length}
                  </p>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Need your approval
                  </div>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-semibold text-neutral-800 dark:text-neutral-200">
                    To Grade
                  </h2>
                  <p className="text-3xl font-bold text-red-500 mt-2">
                    {isLoading
                      ? "-"
                      : (analytics?.totalSubmissions || 0) -
                        (analytics?.gradedSubmissions || 0)}
                  </p>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    of{" "}
                    <span className="font-medium">
                      {isLoading ? "-" : analytics?.totalSubmissions || 0}
                    </span>{" "}
                    total
                  </div>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <ClipboardList className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/tutor/courses/new">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <PlusCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Create New Course</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Start building a new course from scratch
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/tutor/enrollments">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Manage Enrollments</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Review and approve student enrollments
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/tutor/submissions">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <ClipboardList className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Grade Submissions</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Review and grade student submissions
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Pending Enrollments Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-200">
              Pending Enrollment Requests
            </h2>
            <Link href="/tutor/enrollments">
              <a className="text-primary hover:text-primary/90 font-medium text-sm flex items-center gap-1">
                View All
                <ExternalLink className="h-3 w-3" />
              </a>
            </Link>
          </div>
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  <p>Loading enrollment requests...</p>
                </div>
              </CardContent>
            </Card>
          ) : pendingEnrollments.length === 0 ? (
            <Card>
              <CardContent className="p-6 flex items-center justify-center">
                <div className="text-center py-4">
                  <div className="mx-auto w-12 h-12 mb-3 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    No pending enrollment requests
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingEnrollments.slice(0, 3).map((enrollment) => (
                <Card
                  key={enrollment.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {enrollment.student.fullName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-neutral-800 dark:text-neutral-200">
                              {enrollment.student.fullName}
                            </h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {enrollment.student.email}
                            </p>
                          </div>
                        </div>
                        <div className="ml-13">
                          <p className="text-sm text-neutral-500 dark:text-neutral-500">
                            Course:{" "}
                            <span className="font-medium">
                              {enrollment.course.title}
                            </span>
                          </p>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            Requested:{" "}
                            {new Date(
                              enrollment.enrolledAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleEnrollmentAction(enrollment.id, "approve")
                          }
                          className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleEnrollmentAction(enrollment.id, "reject")
                          }
                          className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* My Courses Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-200">
              My Courses
            </h2>
            <div className="flex items-center gap-2">
              <Link href="/tutor/courses">
                <a className="text-primary hover:text-primary/90 font-medium text-sm flex items-center gap-1">
                  View All
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Link>
              <Link href="/tutor/courses/new">
                <Button size="sm" className="flex items-center gap-1">
                  <PlusCircle className="h-4 w-4" />
                  <span>New Course</span>
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-4"></div>
                    <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))
            ) : analytics?.courseStatistics &&
              analytics.courseStatistics.length > 0 ? (
              analytics.courseStatistics.slice(0, 6).map((course) => (
                <Card
                  key={course.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-1">
                            {course.title}
                          </h3>
                          <Badge
                            variant={course.isPublished ? "active" : "pending"}
                          >
                            {course.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-neutral-500 dark:text-neutral-400">
                              Students
                            </p>
                            <p className="font-medium text-neutral-800 dark:text-neutral-200">
                              {course.activeStudents}
                            </p>
                          </div>
                          <div>
                            <p className="text-neutral-500 dark:text-neutral-400">
                              Modules
                            </p>
                            <p className="font-medium text-neutral-800 dark:text-neutral-200">
                              {course._count.modules}
                            </p>
                          </div>
                          <div>
                            <p className="text-neutral-500 dark:text-neutral-400">
                              Enrollments
                            </p>
                            <p className="font-medium text-neutral-800 dark:text-neutral-200">
                              {course.enrollments}
                            </p>
                          </div>
                          <div>
                            <p className="text-neutral-500 dark:text-neutral-400">
                              Submissions
                            </p>
                            <p className="font-medium text-neutral-800 dark:text-neutral-200">
                              {course.submissions}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <Link href={`/tutor/courses/${course.slug}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/tutor/courses/${course.slug}/edit`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                      </Link>
                      {/* Updated Modules Button - This is the key change */}
                      <Link
                        href={`/tutor/courses/${course.id}/edit?tab=modules`}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                          title={`Manage modules for ${course.title}`}
                        >
                          <FileText className="h-3 w-3" />
                          Modules
                        </Button>
                      </Link>
                      <Link href={`/tutor/courses/${course.slug}/settings`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Settings className="h-3 w-3" />
                          Settings
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-16 h-16 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Book className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-neutral-800 dark:text-neutral-200">
                    No courses yet
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
                    Start your teaching journey by creating your first course.
                    Share your knowledge and expertise with students around the
                    world.
                  </p>
                  <Link href="/tutor/courses/new">
                    <Button className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Create Your First Course
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-200">
              Recent Activity
            </h2>
            <Link href="/tutor/activity">
              <a className="text-primary hover:text-primary/90 font-medium text-sm flex items-center gap-1">
                View All
                <ExternalLink className="h-3 w-3" />
              </a>
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              {loadingActivity ? (
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <p>Loading recent activity...</p>
                  </div>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="mx-auto w-12 h-12 mb-3 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-neutral-400" />
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    No recent activity
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {recentActivity.slice(0, 5).map((activity, index) => (
                    <div
                      key={activity.id}
                      className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-neutral-800 dark:text-neutral-200">
                            {activity.message}
                          </p>
                          {activity.course && (
                            <Link
                              href={`/tutor/courses/${activity.course.slug}`}
                            >
                              <a className="text-xs text-primary hover:underline">
                                {activity.course.title}
                              </a>
                            </Link>
                          )}
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Performance Overview */}
        <section>
          <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
            Performance Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-neutral-800 dark:text-neutral-200">
                  Course Completion Rate
                </h3>
                <div className="space-y-3">
                  {analytics?.courseStatistics?.slice(0, 3).map((course) => {
                    const completionRate =
                      course.activeStudents > 0
                        ? Math.round(
                            (course.submissions / course.activeStudents) * 100,
                          )
                        : 0;
                    return (
                      <div key={course.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-600 dark:text-neutral-400 truncate">
                            {course.title}
                          </span>
                          <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                            {completionRate}%
                          </span>
                        </div>
                        <ProgressBar value={completionRate} className="h-2" />
                      </div>
                    );
                  }) || (
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                      No course data available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-neutral-800 dark:text-neutral-200">
                  Grading Progress
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Submissions Graded
                      </span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                        {analytics?.gradedSubmissions || 0} of{" "}
                        {analytics?.totalSubmissions || 0}
                      </span>
                    </div>
                    <ProgressBar
                      value={
                        analytics?.totalSubmissions
                          ? Math.round(
                              ((analytics.gradedSubmissions || 0) /
                                analytics.totalSubmissions) *
                                100,
                            )
                          : 0
                      }
                      className="h-3"
                    />
                  </div>
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Pending Reviews
                      </span>
                      <span className="text-orange-600 font-medium">
                        {(analytics?.totalSubmissions || 0) -
                          (analytics?.gradedSubmissions || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
