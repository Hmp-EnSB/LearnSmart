import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { 
  Book, 
  Users, 
  ClipboardList, 
  CheckCircle, 
  AlertCircle, 
  PlusCircle,
} from 'lucide-react';

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
  enrollments: number;
  activeStudents: number;
  submissions: number;
}

export default function TutorDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<TutorAnalytics | null>(null);
  
  // Fetch tutor analytics
  const { data, isLoading } = useQuery({
    queryKey: ['/api/analytics/tutor'],
  });
  
  useEffect(() => {
    if (data) {
      setAnalytics(data);
    }
  }, [data]);

  return (
    <MainLayout title="Tutor Dashboard">
      <div className="space-y-6">
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Welcome back, <span className="font-medium">{user?.fullName}</span>
        </p>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading font-semibold text-neutral-800 dark:text-neutral-200">Total Courses</h2>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-bold text-primary">
                  {isLoading ? '-' : analytics?.totalCourses || 0}
                </p>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {isLoading ? '-' : analytics?.publishedCourses || 0}
                  </span> published
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading font-semibold text-neutral-800 dark:text-neutral-200">Active Students</h2>
              <p className="text-3xl font-bold text-primary mt-2">
                {isLoading ? '-' : analytics?.totalStudents || 0}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading font-semibold text-neutral-800 dark:text-neutral-200">Pending Enrollments</h2>
              <p className="text-3xl font-bold text-secondary-500 mt-2">
                {isLoading ? '-' : analytics?.pendingEnrollments || 0}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading font-semibold text-neutral-800 dark:text-neutral-200">Submissions to Grade</h2>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-bold text-primary">
                  {isLoading ? '-' : (analytics?.totalSubmissions || 0) - (analytics?.gradedSubmissions || 0)}
                </p>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  of <span className="font-medium">{isLoading ? '-' : analytics?.totalSubmissions || 0}</span> total
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-200">My Courses</h2>
            <div className="flex items-center gap-2">
              <Link href="/tutor/courses">
                <a className="text-primary hover:text-primary/90 font-medium text-sm">View All</a>
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
              <Card>
                <CardContent className="p-6">
                  <p>Loading courses...</p>
                </CardContent>
              </Card>
            ) : !analytics || analytics.courseStatistics.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Book className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-neutral-800 dark:text-neutral-200">No courses yet</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">Create your first course to get started</p>
                  <Link href="/tutor/courses/new">
                    <Button className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      <span>Create Course</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              analytics.courseStatistics.slice(0, 3).map((course) => (
                <Card key={course.id} className="overflow-hidden">
                  <div className="h-40 bg-neutral-200 dark:bg-neutral-700">
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                      <span className="text-lg font-medium">{course.title.substring(0, 1)}</span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-heading font-semibold text-lg text-neutral-800 dark:text-neutral-200">{course.title}</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">Students:</span>
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">{course.activeStudents}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">Enrollments:</span>
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">{course.enrollments}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">Submissions:</span>
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">{course.submissions}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <Link href={`/tutor/courses/${course.id}/edit`}>
                        <Button variant="outline" size="sm">Manage</Button>
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
            <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-200">Enrollment Requests</h2>
            <Link href="/tutor/enrollments">
              <a className="text-primary hover:text-primary/90 font-medium text-sm">View All</a>
            </Link>
          </div>
          
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <p>Loading enrollment requests...</p>
              </CardContent>
            </Card>
          ) : !analytics || analytics.pendingEnrollments === 0 ? (
            <Card>
              <CardContent className="p-6 flex items-center justify-center">
                <div className="text-center py-4">
                  <div className="mx-auto w-12 h-12 mb-3 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">No pending enrollment requests</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-500">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-800 dark:text-neutral-200">Pending Enrollment Requests</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        You have {analytics.pendingEnrollments} pending enrollment requests
                      </p>
                    </div>
                  </div>
                  <Link href="/tutor/enrollments">
                    <Button>Review Requests</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-200">Recent Activity</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-lg mb-4 text-neutral-800 dark:text-neutral-200">Submission Status</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Graded</span>
                      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {isLoading ? '-' : analytics?.gradedSubmissions || 0} / {isLoading ? '-' : analytics?.totalSubmissions || 0}
                      </span>
                    </div>
                    <ProgressBar 
                      value={isLoading || !analytics?.totalSubmissions ? 0 : Math.round((analytics.gradedSubmissions / analytics.totalSubmissions) * 100)} 
                      size="sm"
                    />
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-neutral-50 p-4 rounded-lg dark:bg-neutral-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-primary" />
                        <h4 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Active Students</h4>
                      </div>
                      <p className="text-2xl font-bold text-primary">{isLoading ? '-' : analytics?.totalStudents || 0}</p>
                    </div>
                    
                    <div className="bg-neutral-50 p-4 rounded-lg dark:bg-neutral-800">
                      <div className="flex items-center gap-2 mb-2">
                        <ClipboardList className="h-4 w-4 text-secondary-500" />
                        <h4 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">To Grade</h4>
                      </div>
                      <p className="text-2xl font-bold text-secondary-500">
                        {isLoading ? '-' : (analytics?.totalSubmissions || 0) - (analytics?.gradedSubmissions || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-lg mb-4 text-neutral-800 dark:text-neutral-200">Course Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="active">Active</Badge>
                      <span className="text-neutral-800 dark:text-neutral-200">Published Courses</span>
                    </div>
                    <span className="font-medium">{isLoading ? '-' : analytics?.publishedCourses || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="pending">Draft</Badge>
                      <span className="text-neutral-800 dark:text-neutral-200">Unpublished Courses</span>
                    </div>
                    <span className="font-medium">
                      {isLoading ? '-' : (analytics?.totalCourses || 0) - (analytics?.publishedCourses || 0)}
                    </span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        Total Enrollments
                      </h4>
                      <Link href="/tutor/analytics">
                        <a className="text-primary hover:text-primary/90 text-sm">View Analytics</a>
                      </Link>
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-lg dark:bg-neutral-800 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-primary">{isLoading ? '-' : analytics?.totalEnrollments || 0}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Total enrollments across all courses</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">{isLoading ? '-' : analytics?.activeEnrollments || 0}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Active</p>
                      </div>
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
