import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Line
} from 'recharts';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Users, 
  BookOpen, 
  ClipboardList, 
  Award,
  TrendingUp
} from 'lucide-react';

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

// Colors for the charts
const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
const USER_COLORS = {
  'students': '#2563eb',
  'tutors': '#f59e0b',
  'admins': '#10b981'
};
const SCORE_COLORS = {
  '0-20': '#ef4444',
  '21-40': '#f97316',
  '41-60': '#eab308',
  '61-80': '#84cc16',
  '81-100': '#22c55e'
};

export default function AdminDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AdminAnalyticsData | null>(null);
  
  // Fetch analytics data
  const { data, isLoading } = useQuery({
    queryKey: ['/api/analytics/admin'],
  });
  
  // Process analytics data
  useEffect(() => {
    if (data) {
      setAnalyticsData(data);
    }
  }, [data]);
  
  return (
    <MainLayout title="Admin Dashboard">
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading analytics data...</p>
          </div>
        ) : analyticsData ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Users</p>
                    <p className="text-3xl font-bold text-primary mt-1">
                      {analyticsData.usersStats.totalUsers}
                    </p>
                    <p className="text-xs text-green-600">
                      +{analyticsData.usersStats.newUsersThisMonth} this month
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
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Active Courses</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {analyticsData.coursesStats.publishedCourses}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      of {analyticsData.coursesStats.totalCourses} total
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
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Enrollments</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">
                      {analyticsData.enrollmentsStats.totalEnrollments}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {analyticsData.enrollmentsStats.activeEnrollments} active
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
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Badges Awarded</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-1">
                      {analyticsData.badgesStats.badgesAwarded}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      across {analyticsData.badgesStats.totalBadges} badges
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
                          data={analyticsData.usersStats.userGrowth}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="count" name="New Users" stroke="#2563eb" activeDot={{ r: 8 }} />
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
                                { name: 'Students', value: analyticsData.usersStats.studentCount },
                                { name: 'Tutors', value: analyticsData.usersStats.tutorCount },
                                { name: 'Admins', value: analyticsData.usersStats.adminCount }
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell key="students" fill={USER_COLORS.students} />
                              <Cell key="tutors" fill={USER_COLORS.tutors} />
                              <Cell key="admins" fill={USER_COLORS.admins} />
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
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
                          <span>{analyticsData.usersStats.totalUsers}</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">Students:</span>
                          <span className="text-primary">{analyticsData.usersStats.studentCount}</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">Tutors:</span>
                          <span className="text-yellow-600">{analyticsData.usersStats.tutorCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Admins:</span>
                          <span className="text-green-600">{analyticsData.usersStats.adminCount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="courses" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Popular Courses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analyticsData.coursesStats.popularCourses}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="course" angle={-45} textAnchor="end" height={70} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="enrollments" name="Enrollments" fill="#2563eb" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">Total Courses:</span>
                          <span>{analyticsData.coursesStats.totalCourses}</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">Published Courses:</span>
                          <span className="text-green-600">{analyticsData.coursesStats.publishedCourses}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Unpublished Courses:</span>
                          <span className="text-yellow-600">
                            {analyticsData.coursesStats.totalCourses - analyticsData.coursesStats.publishedCourses}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analyticsData.coursesStats.coursesPerCategory}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="category"
                            >
                              {analyticsData.coursesStats.coursesPerCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} courses`, 'Count']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
                          data={analyticsData.enrollmentsStats.enrollmentsByMonth}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="count" name="Enrollments" stroke="#2563eb" activeDot={{ r: 8 }} />
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
                        <h3 className="text-lg font-medium">Total Enrollments</h3>
                        <p className="text-3xl font-bold text-primary">
                          {analyticsData.enrollmentsStats.totalEnrollments}
                        </p>
                      </div>
                      
                      <div className="space-y-3 p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                        <h3 className="text-lg font-medium">Active Enrollments</h3>
                        <p className="text-3xl font-bold text-green-600">
                          {analyticsData.enrollmentsStats.activeEnrollments}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {analyticsData.enrollmentsStats.totalEnrollments > 0 
                            ? `${((analyticsData.enrollmentsStats.activeEnrollments / analyticsData.enrollmentsStats.totalEnrollments) * 100).toFixed(1)}%`
                            : '0%'} of total
                        </p>
                      </div>
                      
                      <div className="space-y-3 p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                        <h3 className="text-lg font-medium">Completed Enrollments</h3>
                        <p className="text-3xl font-bold text-blue-600">
                          {analyticsData.enrollmentsStats.completedEnrollments}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {analyticsData.enrollmentsStats.totalEnrollments > 0 
                            ? `${((analyticsData.enrollmentsStats.completedEnrollments / analyticsData.enrollmentsStats.totalEnrollments) * 100).toFixed(1)}%`
                            : '0%'} of total
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
                          <span className="font-medium">Total Submissions:</span>
                          <span>{analyticsData.submissionsStats.totalSubmissions}</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">Graded Submissions:</span>
                          <span className="text-green-600">{analyticsData.submissionsStats.gradedSubmissions}</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b">
                          <span className="font-medium">Pending Grading:</span>
                          <span className="text-yellow-600">
                            {analyticsData.submissionsStats.totalSubmissions - analyticsData.submissionsStats.gradedSubmissions}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Average Score:</span>
                          <span className="text-blue-600">{analyticsData.submissionsStats.averageScore.toFixed(1)}/100</span>
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
                              data={analyticsData.submissionsStats.scoreDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="range"
                            >
                              {analyticsData.submissionsStats.scoreDistribution.map((entry) => (
                                <Cell 
                                  key={`cell-${entry.range}`} 
                                  fill={SCORE_COLORS[entry.range as keyof typeof SCORE_COLORS]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} submissions`, 'Count']} />
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
                          data={analyticsData.badgesStats.popularBadges}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="badge" angle={-45} textAnchor="end" height={70} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="awards" name="Times Awarded" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No analytics data available</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Start creating courses, enrolling students, and assigning badges to generate analytics data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}