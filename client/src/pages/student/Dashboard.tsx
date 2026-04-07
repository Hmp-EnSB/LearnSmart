import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { Calendar, Clock, AlertCircle } from "lucide-react";

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  tutor: {
    id: number;
    fullName: string;
  };
}

interface EnrolledCourse extends Course {
  progress: number;
}

interface Assignment {
  id: number;
  title: string;
  dueDate: string;
  course: {
    title: string;
    slug: string;
  };
  status: "pending" | "urgent" | "completed";
}

interface BadgeItem {
  badge: {
    id: number;
    name: string;
    description: string;
    iconUrl: string;
  };
  userBadge: {
    id: number;
    awardedAt: string;
  };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>(
    [],
  );
  const [overallProgress, setOverallProgress] = useState(0);

  // Fetch student analytics
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["/api/analytics/student"],
  });

  // Fetch enrollments with courses
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ["/api/enrollments?student=me"],
  });

  // Fetch badges
  const { data: badges, isLoading: loadingBadges } = useQuery({
    queryKey: ["/api/users/me/badges"],
  });

  // Transform enrollments data for display
  useEffect(() => {
    if (enrollments && analytics) {
      const activeEnrollments = enrollments.filter(
        (e: any) => e.status === "active" || e.status === "completed",
      );

      const courses = activeEnrollments.map((enrollment: any) => ({
        id: enrollment.course.id,
        title: enrollment.course.title,
        slug: enrollment.course.slug,
        description: enrollment.course.description,
        tutor: enrollment.course.tutor,
        // Add safety check for courseProgress
        progress: analytics?.courseProgress?.[enrollment.course.id] || 0,
      }));

      setEnrolledCourses(courses);

      // Calculate overall progress
      if (courses.length > 0) {
        const totalProgress = courses.reduce(
          (sum: number, course: EnrolledCourse) => sum + course.progress,
          0,
        );
        setOverallProgress(Math.round(totalProgress / courses.length));
      }
    }
  }, [enrollments, analytics]);

  // Handle case when we have enrollments but no analytics yet
  useEffect(() => {
    if (enrollments && !analytics && !loadingAnalytics) {
      const activeEnrollments = enrollments.filter(
        (e: any) => e.status === "active" || e.status === "completed",
      );

      const courses = activeEnrollments.map((enrollment: any) => ({
        id: enrollment.course.id,
        title: enrollment.course.title,
        slug: enrollment.course.slug,
        description: enrollment.course.description,
        tutor: enrollment.course.tutor,
        progress: 0, // Default to 0 when no analytics available
      }));

      setEnrolledCourses(courses);
      setOverallProgress(0);
    }
  }, [enrollments, analytics, loadingAnalytics]);

  // Simulate getting upcoming assignments
  useEffect(() => {
    if (enrollments) {
      const activeEnrollments = enrollments.filter(
        (e: any) => e.status === "active",
      );

      // Fetch assignment data for active enrollments
      Promise.all(
        activeEnrollments.map(
          (enrollment: any) =>
            fetch(`/api/assignments?courseId=${enrollment.course.id}`)
              .then((res) => res.json())
              .catch(() => []), // Handle fetch errors gracefully
        ),
      )
        .then((courseAssignmentsArray) => {
          const today = new Date();
          const assignments: Assignment[] = [];

          courseAssignmentsArray.forEach(
            (courseAssignments: any[], index: number) => {
              if (!courseAssignments || !Array.isArray(courseAssignments))
                return;

              const courseSlug = activeEnrollments[index]?.course?.slug;
              const courseTitle = activeEnrollments[index]?.course?.title;

              if (!courseSlug || !courseTitle) return;

              courseAssignments.forEach((assignment) => {
                if (!assignment?.dueDate) return;

                const dueDate = new Date(assignment.dueDate);
                const diffDays = Math.round(
                  (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24),
                );

                // Only include pending assignments
                if (diffDays >= -1) {
                  assignments.push({
                    id: assignment.id,
                    title: assignment.title,
                    dueDate: assignment.dueDate,
                    course: {
                      title: courseTitle,
                      slug: courseSlug,
                    },
                    status: diffDays <= 2 ? "urgent" : "pending",
                  });
                }
              });
            },
          );

          // Sort by due date (ascending)
          assignments.sort(
            (a, b) =>
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
          );

          setPendingAssignments(assignments);
        })
        .catch((error) => {
          console.error("Error fetching assignments:", error);
          setPendingAssignments([]);
        });
    }
  }, [enrollments]);

  const isLoading = loadingAnalytics || loadingEnrollments || loadingBadges;

  return (
    <MainLayout title="Student Dashboard">
      <div className="space-y-6">
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Welcome back, <span className="font-medium">{user?.fullName}</span>
        </p>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading font-semibold text-neutral-800 dark:text-neutral-200">
                Enrolled Courses
              </h2>
              <p className="text-3xl font-bold text-primary mt-2">
                {isLoading ? "-" : enrolledCourses.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading font-semibold text-neutral-800 dark:text-neutral-200">
                Pending Assignments
              </h2>
              <p className="text-3xl font-bold text-secondary-500 mt-2">
                {isLoading ? "-" : pendingAssignments.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading font-semibold text-neutral-800 dark:text-neutral-200">
                Badges Earned
              </h2>
              <p className="text-3xl font-bold text-success-500 mt-2">
                {isLoading ? "-" : badges?.length || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading font-semibold text-neutral-800 dark:text-neutral-200">
                Overall Progress
              </h2>
              <div className="mt-2">
                <ProgressBar value={overallProgress} size="md" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  {overallProgress}% complete
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-200">
              My Courses
            </h2>
            <Link href="/student/courses">
              <a className="text-primary hover:text-primary/90 font-medium text-sm">
                View All
              </a>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <p>Loading courses...</p>
            ) : enrolledCourses.length === 0 ? (
              <p className="col-span-full text-neutral-600 dark:text-neutral-400">
                You haven't enrolled in any courses yet. Browse available
                courses to get started!
              </p>
            ) : (
              enrolledCourses.slice(0, 3).map((course) => (
                <Card key={course.id} className="overflow-hidden">
                  <div className="h-40 bg-neutral-200 dark:bg-neutral-700">
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                      <span className="text-lg font-medium">
                        {course.title.substring(0, 1)}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-heading font-semibold text-lg text-neutral-800 dark:text-neutral-200">
                      {course.title}
                    </h3>
                    <p className="text-neutral-600 text-sm mt-1 dark:text-neutral-400">
                      By {course.tutor?.fullName || "Unknown Tutor"}
                    </p>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="w-3/4">
                        <ProgressBar value={course.progress} size="sm" />
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                          {course.progress}% complete
                        </p>
                      </div>
                      <Link href={`/student/courses/${course.slug}`}>
                        <a className="text-primary hover:text-primary/90 font-medium text-sm">
                          Continue
                        </a>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-200">
              Upcoming Assignments
            </h2>
            <Link href="/student/assignments">
              <a className="text-primary hover:text-primary/90 font-medium text-sm">
                View All
              </a>
            </Link>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                <thead className="bg-neutral-50 dark:bg-neutral-800">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400"
                    >
                      Assignment
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400"
                    >
                      Course
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400"
                    >
                      Due Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200 dark:bg-neutral-800 dark:divide-neutral-700">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-center text-neutral-600 dark:text-neutral-400"
                      >
                        Loading assignments...
                      </td>
                    </tr>
                  ) : pendingAssignments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-center text-neutral-600 dark:text-neutral-400"
                      >
                        No pending assignments found.
                      </td>
                    </tr>
                  ) : (
                    pendingAssignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-200">
                            {assignment.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">
                            {assignment.course.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(assignment.dueDate).toLocaleDateString()}
                            <Clock className="h-4 w-4 mx-1 ml-2" />
                            {new Date(assignment.dueDate).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {assignment.status === "urgent" ? (
                            <Badge
                              variant="urgent"
                              className="flex items-center"
                            >
                              <AlertCircle className="h-3 w-3 mr-1" />
                              <span>Urgent</span>
                            </Badge>
                          ) : (
                            <Badge variant="pending">Pending</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link href={`/student/assignments/${assignment.id}`}>
                            <a className="text-primary hover:text-primary/90">
                              Start
                            </a>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-200">
              Achievement Badges
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {isLoading ? (
              <p>Loading badges...</p>
            ) : !badges || badges.length === 0 ? (
              <p className="col-span-full text-neutral-600 dark:text-neutral-400">
                Complete assignments and courses to earn achievement badges!
              </p>
            ) : (
              badges.slice(0, 6).map((item: BadgeItem) => (
                <Card key={item.badge.id} className="p-4 text-center">
                  <div className="w-12 h-12 mx-auto bg-primary-100 text-primary rounded-full flex items-center justify-center dark:bg-primary-900">
                    {/* In a real app, you'd use the badge.iconUrl for specific badge icons */}
                    <span className="text-lg font-bold">
                      {item.badge.name.substring(0, 1)}
                    </span>
                  </div>
                  <h3 className="font-medium text-neutral-800 mt-2 dark:text-neutral-200">
                    {item.badge.name}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
                    {item.badge.description}
                  </p>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
