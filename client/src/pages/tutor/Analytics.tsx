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
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, ClipboardList, Trophy } from "lucide-react";

interface AnalyticsData {
  coursesStats: {
    totalCourses: number;
    publishedCourses: number;
    totalModules: number;
    totalAssignments: number;
  };
  enrollmentsStats: {
    totalEnrollments: number;
    activeEnrollments: number;
    pendingEnrollments: number;
    courseEnrollments: { name: string; count: number }[];
  };
  submissionsStats: {
    totalSubmissions: number;
    gradedSubmissions: number;
    averageScore: number;
    submissionsByMonth: { month: string; count: number }[];
    scoreDistribution: { range: string; count: number }[];
  };
  courseActivity: {
    course: string;
    enrollments: number;
    submissions: number;
    completionRate: number;
  }[];
}

// Colors for the charts
const COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];
const SCORE_COLORS = {
  "0-20": "#ef4444",
  "21-40": "#f97316",
  "41-60": "#eab308",
  "61-80": "#84cc16",
  "81-100": "#22c55e",
};

export default function TutorAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );

  // Fetch analytics data
  const { data, isLoading } = useQuery({
    queryKey: ["/api/analytics/tutor"],
  });

  // Process analytics data
  useEffect(() => {
    if (data) {
      setAnalyticsData(data);
    }
  }, [data]);

  return (
    <MainLayout title="Analytics Dashboard">
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading analytics data...</p>
          </div>
        ) : analyticsData &&
          analyticsData.coursesStats &&
          analyticsData.enrollmentsStats &&
          analyticsData.submissionsStats ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Total Courses
                    </p>
                    <p className="text-3xl font-bold text-primary mt-1">
                      {analyticsData.coursesStats.totalCourses || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary dark:bg-primary-900">
                    <BookOpen className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Active Students
                    </p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {analyticsData.enrollmentsStats.activeEnrollments || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 dark:bg-green-900 dark:text-green-400">
                    <Users className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Submissions
                    </p>
                    <p className="text-3xl font-bold text-secondary-500 mt-1">
                      {analyticsData.submissionsStats.totalSubmissions || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-500 dark:bg-secondary-900 dark:text-secondary-400">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Avg. Score
                    </p>
                    <p className="text-3xl font-bold text-orange-500 mt-1">
                      {(
                        analyticsData.submissionsStats.averageScore || 0
                      ).toFixed(1)}
                      /100
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 dark:bg-orange-900 dark:text-orange-400">
                    <Trophy className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <Tabs defaultValue="courses" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
              </TabsList>

              <TabsContent value="courses" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analyticsData.courseActivity || []}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="course"
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="enrollments"
                            name="Enrollments"
                            fill="#2563eb"
                          />
                          <Bar
                            dataKey="submissions"
                            name="Submissions"
                            fill="#60a5fa"
                          />
                          <Bar
                            dataKey="completionRate"
                            name="Completion Rate (%)"
                            fill="#84cc16"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">Total Courses:</span>
                          <span>
                            {analyticsData.coursesStats.totalCourses || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">
                            Published Courses:
                          </span>
                          <span>
                            {analyticsData.coursesStats.publishedCourses || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">Total Modules:</span>
                          <span>
                            {analyticsData.coursesStats.totalModules || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            Total Assignments:
                          </span>
                          <span>
                            {analyticsData.coursesStats.totalAssignments || 0}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Course Enrollments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={
                                analyticsData.enrollmentsStats
                                  .courseEnrollments || []
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
                            >
                              {(
                                analyticsData.enrollmentsStats
                                  .courseEnrollments || []
                              ).map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => [
                                `${value} students`,
                                "Enrollments",
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="students" className="space-y-6">
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
                          {analyticsData.enrollmentsStats.totalEnrollments || 0}
                        </p>
                      </div>

                      <div className="space-y-3 p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                        <h3 className="text-lg font-medium">Active Students</h3>
                        <p className="text-3xl font-bold text-green-600">
                          {analyticsData.enrollmentsStats.activeEnrollments ||
                            0}
                        </p>
                      </div>

                      <div className="space-y-3 p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                        <h3 className="text-lg font-medium">
                          Pending Requests
                        </h3>
                        <p className="text-3xl font-bold text-yellow-500">
                          {analyticsData.enrollmentsStats.pendingEnrollments ||
                            0}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4">
                        Student Engagement by Course
                      </h3>
                      <div className="space-y-2">
                        {(
                          analyticsData.enrollmentsStats.courseEnrollments || []
                        ).map((course, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{course.name}</span>
                              <span>{course.count} students</span>
                            </div>
                            <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden dark:bg-neutral-700">
                              <div
                                className="bg-primary h-full"
                                style={{
                                  width: `${(course.count / Math.max(...(analyticsData.enrollmentsStats.courseEnrollments || []).map((c) => c.count), 1)) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="submissions" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Submission Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={
                              analyticsData.submissionsStats
                                .submissionsByMonth || []
                            }
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar
                              dataKey="count"
                              name="Submissions"
                              fill="#2563eb"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Score Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={
                                analyticsData.submissionsStats
                                  .scoreDistribution || []
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
                                  .scoreDistribution || []
                              ).map((entry) => (
                                <Cell
                                  key={`cell-${entry.range}`}
                                  fill={
                                    SCORE_COLORS[
                                      entry.range as keyof typeof SCORE_COLORS
                                    ]
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
                    <CardTitle>Submission Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3 p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                        <h3 className="text-lg font-medium">
                          Total Submissions
                        </h3>
                        <p className="text-3xl font-bold text-primary">
                          {analyticsData.submissionsStats.totalSubmissions || 0}
                        </p>
                      </div>

                      <div className="space-y-3 p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                        <h3 className="text-lg font-medium">
                          Graded Submissions
                        </h3>
                        <p className="text-3xl font-bold text-green-600">
                          {analyticsData.submissionsStats.gradedSubmissions ||
                            0}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {(analyticsData.submissionsStats.totalSubmissions ||
                            0) > 0
                            ? `${(((analyticsData.submissionsStats.gradedSubmissions || 0) / (analyticsData.submissionsStats.totalSubmissions || 1)) * 100).toFixed(1)}%`
                            : "0%"}{" "}
                          of total
                        </p>
                      </div>

                      <div className="space-y-3 p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                        <h3 className="text-lg font-medium">Average Score</h3>
                        <p className="text-3xl font-bold text-orange-500">
                          {(
                            analyticsData.submissionsStats.averageScore || 0
                          ).toFixed(1)}
                          /100
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">
                No analytics data available
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Start creating courses and assignments to generate analytics
                data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
