import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  BookOpen,
  ClipboardList,
  Award,
  TrendingUp,
} from "lucide-react";

interface AdminAnalyticsData {
  usersStats: {
    totalUsers: number;
    studentCount: number;
    tutorCount: number;
    adminCount: number;
    newUsersThisMonth: number;
    userGrowth: { month: string; count: number }[];
  };
  coursesStats: {
    totalCourses: number;
    publishedCourses: number;
    coursesPerCategory: { category: string; count: number }[];
    popularCourses: { course: string; enrollments: number }[];
  };
  enrollmentsStats: {
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    enrollmentsByMonth: { month: string; count: number }[];
  };
  submissionsStats: {
    totalSubmissions: number;
    gradedSubmissions: number;
    averageScore: number;
    scoreDistribution: { range: string; count: number }[];
  };
  badgesStats: {
    totalBadges: number;
    badgesAwarded: number;
    popularBadges: { badge: string; awards: number }[];
  };
}

// Default data structure
const defaultAnalyticsData: AdminAnalyticsData = {
  usersStats: {
    totalUsers: 0,
    studentCount: 0,
    tutorCount: 0,
    adminCount: 0,
    newUsersThisMonth: 0,
    userGrowth: [],
  },
  coursesStats: {
    totalCourses: 0,
    publishedCourses: 0,
    coursesPerCategory: [],
    popularCourses: [],
  },
  enrollmentsStats: {
    totalEnrollments: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
    enrollmentsByMonth: [],
  },
  submissionsStats: {
    totalSubmissions: 0,
    gradedSubmissions: 0,
    averageScore: 0,
    scoreDistribution: [],
  },
  badgesStats: {
    totalBadges: 0,
    badgesAwarded: 0,
    popularBadges: [],
  },
};

// Colors for the charts
const COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];
const USER_COLORS = {
  students: "#2563eb",
  tutors: "#f59e0b",
  admins: "#10b981",
};
const SCORE_COLORS = {
  "0-20": "#ef4444",
  "21-40": "#f97316",
  "41-60": "#eab308",
  "61-80": "#84cc16",
  "81-100": "#22c55e",
};

export default function AdminDashboard() {
  const [analyticsData, setAnalyticsData] =
    useState<AdminAnalyticsData>(defaultAnalyticsData);

  // Fetch analytics data
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/analytics/admin"],
  });

  // Process analytics data
  useEffect(() => {
    if (data) {
      // Merge with default data to ensure all properties exist
      setAnalyticsData({
        usersStats: { ...defaultAnalyticsData.usersStats, ...data.usersStats },
        coursesStats: {
          ...defaultAnalyticsData.coursesStats,
          ...data.coursesStats,
        },
        enrollmentsStats: {
          ...defaultAnalyticsData.enrollmentsStats,
          ...data.enrollmentsStats,
        },
        submissionsStats: {
          ...defaultAnalyticsData.submissionsStats,
          ...data.submissionsStats,
        },
        badgesStats: {
          ...defaultAnalyticsData.badgesStats,
          ...data.badgesStats,
        },
      });
    }
  }, [data]);

  // Safe access helper function
  const safeGet = (obj: any, path: string, defaultValue: any = 0) => {
    return (
      path.split(".").reduce((current, key) => current?.[key], obj) ??
      defaultValue
    );
  };

  return (
    <MainLayout title="Admin Dashboard">
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading analytics data...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2 text-red-600">
                Error loading analytics
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Unable to load analytics data. Please try again later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Total Users
                    </p>
                    <p className="text-3xl font-bold text-primary mt-1">
                      {safeGet(analyticsData, "usersStats.totalUsers", 0)}
                    </p>
                    <p className="text-xs text-green-600">
                      +
                      {safeGet(
                        analyticsData,
                        "usersStats.newUsersThisMonth",
                        0,
                      )}{" "}
                      this month
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary dark:bg-primary-900">
                    <Users className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Active Courses
                    </p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {safeGet(
                        analyticsData,
                        "coursesStats.publishedCourses",
                        0,
                      )}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      of{" "}
                      {safeGet(analyticsData, "coursesStats.totalCourses", 0)}{" "}
                      total
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 dark:bg-green-900 dark:text-green-400">
                    <BookOpen className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Enrollments
                    </p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">
                      {safeGet(
                        analyticsData,
                        "enrollmentsStats.totalEnrollments",
                        0,
                      )}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {safeGet(
                        analyticsData,
                        "enrollmentsStats.activeEnrollments",
                        0,
                      )}{" "}
                      active
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Badges Awarded
                    </p>
                    <p className="text-3xl font-bold text-yellow-600 mt-1">
                      {safeGet(analyticsData, "badgesStats.badgesAwarded", 0)}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      across{" "}
                      {safeGet(analyticsData, "badgesStats.totalBadges", 0)}{" "}
                      badges
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400">
                    <Award className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <Tabs defaultValue="users" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 max-w-xl">
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={analyticsData.usersStats?.userGrowth || []}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="count"
                            name="New Users"
                            stroke="#2563eb"
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                {
                                  name: "Students",
                                  value: safeGet(
                                    analyticsData,
                                    "usersStats.studentCount",
                                    0,
                                  ),
                                },
                                {
                                  name: "Tutors",
                                  value: safeGet(
                                    analyticsData,
                                    "usersStats.tutorCount",
                                    0,
                                  ),
                                },
                                {
                                  name: "Admins",
                                  value: safeGet(
                                    analyticsData,
                                    "usersStats.adminCount",
                                    0,
                                  ),
                                },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell
                                key="students"
                                fill={USER_COLORS.students}
                              />
                              <Cell key="tutors" fill={USER_COLORS.tutors} />
                              <Cell key="admins" fill={USER_COLORS.admins} />
                            </Pie>
                            <Tooltip
                              formatter={(value) => [`${value} users`, "Count"]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>User Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">Total Users:</span>
                          <span>
                            {safeGet(analyticsData, "usersStats.totalUsers", 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">Students:</span>
                          <span className="text-primary">
                            {safeGet(
                              analyticsData,
                              "usersStats.studentCount",
                              0,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">Tutors:</span>
                          <span className="text-yellow-600">
                            {safeGet(analyticsData, "usersStats.tutorCount", 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Admins:</span>
                          <span className="text-green-600">
                            {safeGet(analyticsData, "usersStats.adminCount", 0)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Rest of the tabs content with similar safe access patterns */}
              <TabsContent value="courses" className="space-y-6">
                <Card>
                  <CardContent className="p-8 text-center">
                    <h3 className="text-lg font-medium mb-2">
                      Course Analytics
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Course analytics will be displayed here when data is
                      available.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="enrollments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Enrollment Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={
                            analyticsData.enrollmentsStats
                              ?.enrollmentsByMonth || []
                          }
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="count"
                            name="Enrollments"
                            stroke="#2563eb"
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Enrollment Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3 p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                        <h3 className="text-lg font-medium">
                          Total Enrollments
                        </h3>
                        <p className="text-3xl font-bold text-primary">
                          {safeGet(
                            analyticsData,
                            "enrollmentsStats.totalEnrollments",
                            0,
                          )}
                        </p>
                      </div>

                      <div className="space-y-3 p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                        <h3 className="text-lg font-medium">
                          Active Enrollments
                        </h3>
                        <p className="text-3xl font-bold text-green-600">
                          {safeGet(
                            analyticsData,
                            "enrollmentsStats.activeEnrollments",
                            0,
                          )}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {safeGet(
                            analyticsData,
                            "enrollmentsStats.totalEnrollments",
                            0,
                          ) > 0
                            ? `${((safeGet(analyticsData, "enrollmentsStats.activeEnrollments", 0) / safeGet(analyticsData, "enrollmentsStats.totalEnrollments", 1)) * 100).toFixed(1)}%`
                            : "0%"}{" "}
                          of total
                        </p>
                      </div>

                      <div className="space-y-3 p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                        <h3 className="text-lg font-medium">
                          Completed Enrollments
                        </h3>
                        <p className="text-3xl font-bold text-blue-600">
                          {safeGet(
                            analyticsData,
                            "enrollmentsStats.completedEnrollments",
                            0,
                          )}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {safeGet(
                            analyticsData,
                            "enrollmentsStats.totalEnrollments",
                            0,
                          ) > 0
                            ? `${((safeGet(analyticsData, "enrollmentsStats.completedEnrollments", 0) / safeGet(analyticsData, "enrollmentsStats.totalEnrollments", 1)) * 100).toFixed(1)}%`
                            : "0%"}{" "}
                          of total
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="submissions" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Submission Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">
                            Total Submissions:
                          </span>
                          <span>
                            {safeGet(
                              analyticsData,
                              "submissionsStats.totalSubmissions",
                              0,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">
                            Graded Submissions:
                          </span>
                          <span className="text-green-600">
                            {safeGet(
                              analyticsData,
                              "submissionsStats.gradedSubmissions",
                              0,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">Pending Grading:</span>
                          <span className="text-yellow-600">
                            {safeGet(
                              analyticsData,
                              "submissionsStats.totalSubmissions",
                              0,
                            ) -
                              safeGet(
                                analyticsData,
                                "submissionsStats.gradedSubmissions",
                                0,
                              )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Average Score:</span>
                          <span className="text-blue-600">
                            {safeGet(
                              analyticsData,
                              "submissionsStats.averageScore",
                              0,
                            ).toFixed(1)}
                            /100
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Score Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={
                                analyticsData.submissionsStats
                                  ?.scoreDistribution || []
                              }
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="range"
                            >
                              {(
                                analyticsData.submissionsStats
                                  ?.scoreDistribution || []
                              ).map((entry) => (
                                <Cell
                                  key={`cell-${entry.range}`}
                                  fill={
                                    SCORE_COLORS[
                                      entry.range as keyof typeof SCORE_COLORS
                                    ] || "#8884d8"
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => [
                                `${value} submissions`,
                                "Count",
                              ]}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Badge Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analyticsData.badgesStats?.popularBadges || []}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="badge"
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar
                            dataKey="awards"
                            name="Times Awarded"
                            fill="#f59e0b"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Fallback message when no data */}
        {!isLoading && !error && (!data || Object.keys(data).length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">
                No analytics data available
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Start creating courses, enrolling students, and assigning badges
                to generate analytics data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
