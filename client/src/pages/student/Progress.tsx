import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Award, BookOpen, CheckCircle, BarChart3 } from 'lucide-react';

interface CourseProgress {
  id: number;
  title: string;
  slug: string;
  progress: number;
  status: string;
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

interface SubmissionStats {
  total: number;
  graded: number;
  avgScore: number;
  onTime: number;
}

export default function StudentProgress() {
  const { user } = useAuth();
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [submissionStats, setSubmissionStats] = useState<SubmissionStats>({
    total: 0,
    graded: 0,
    avgScore: 0,
    onTime: 0
  });
  
  // Fetch student analytics
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['/api/analytics/student'],
  });
  
  // Fetch enrollments
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['/api/enrollments?student=me'],
  });
  
  // Fetch badges
  const { data: badges, isLoading: loadingBadges } = useQuery({ 
    queryKey: ['/api/users/me/badges'],
  });
  
  // Fetch submissions for stats
  const { data: submissions, isLoading: loadingSubmissions } = useQuery({
    queryKey: ['/api/submissions?student=me'],
  });
  
  // Process course progress
  useEffect(() => {
    if (enrollments && analytics) {
      const courses = enrollments.map((enrollment: any) => ({
        id: enrollment.course.id,
        title: enrollment.course.title,
        slug: enrollment.course.slug,
        progress: analytics.courseProgress[enrollment.course.id] || 0,
        status: enrollment.status
      }));
      
      // Sort by progress (descending)
      courses.sort((a: CourseProgress, b: CourseProgress) => b.progress - a.progress);
      
      setCourseProgress(courses);
      
      // Calculate overall progress
      if (courses.length > 0) {
        const total = courses.reduce((sum: number, course: CourseProgress) => sum + course.progress, 0);
        setOverallProgress(Math.round(total / courses.length));
      }
    }
  }, [enrollments, analytics]);
  
  // Calculate submission stats
  useEffect(() => {
    if (submissions && submissions.length > 0) {
      const total = submissions.length;
      const graded = submissions.filter((s: any) => s.graded).length;
      
      // Calculate average score (only for graded submissions)
      const gradedSubmissions = submissions.filter((s: any) => s.graded && s.score !== null);
      const totalScore = gradedSubmissions.reduce((sum: number, s: any) => sum + s.score, 0);
      const avgScore = gradedSubmissions.length > 0 ? totalScore / gradedSubmissions.length : 0;
      
      // Calculate on-time submissions (placeholder logic - would need proper dueDate from assignment)
      const onTime = submissions.length; // Assuming all are on time for demo
      
      setSubmissionStats({
        total,
        graded,
        avgScore: Math.round(avgScore),
        onTime
      });
    }
  }, [submissions]);
  
  const isLoading = loadingAnalytics || loadingEnrollments || loadingBadges || loadingSubmissions;

  return (
    <MainLayout title="My Progress">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Overall Progress</h3>
                <div className="text-3xl font-bold text-primary">{overallProgress}%</div>
                <ProgressBar value={overallProgress} size="md" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Courses</h3>
                <div className="flex gap-3">
                  <div>
                    <div className="text-3xl font-bold text-primary">{courseProgress.length}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">Total</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">{courseProgress.filter(c => c.status === 'completed').length}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">Completed</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Achievements</h3>
                <div className="flex gap-3">
                  <div>
                    <div className="text-3xl font-bold text-yellow-500">{badges?.length || 0}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">Badges</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-500">{submissionStats.graded}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">Graded Submissions</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Courses</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span>Badges</span>
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Statistics</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="courses" className="space-y-6">
            <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-200">Course Progress</h2>
            
            {isLoading ? (
              <p>Loading course data...</p>
            ) : courseProgress.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center">
                  <p className="text-neutral-600 dark:text-neutral-400">You haven't enrolled in any courses yet.</p>
                </CardContent>
              </Card>
            ) : (
              courseProgress.map(course => (
                <Card key={course.id} className="overflow-hidden shadow-sm">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-heading font-semibold text-lg text-neutral-800 dark:text-neutral-200">{course.title}</h3>
                        <Badge variant={
                          course.status === 'active' ? 'active' : 
                          course.status === 'completed' ? 'completed' : 
                          'pending'
                        }>
                          {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <ProgressBar 
                        value={course.progress} 
                        size="md" 
                        label={`${course.progress}% Complete`} 
                        showPercentage
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="achievements" className="space-y-6">
            <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-200">Earned Badges</h2>
            
            {isLoading ? (
              <p>Loading badges...</p>
            ) : !badges || badges.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center">
                  <p className="text-neutral-600 dark:text-neutral-400">
                    You haven't earned any badges yet. Complete courses and assignments to earn them!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {badges.map((item: BadgeItem) => (
                  <Card key={item.badge.id} className="p-4 text-center">
                    <div className="w-12 h-12 mx-auto bg-primary-100 text-primary rounded-full flex items-center justify-center dark:bg-primary-900">
                      <Award className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium text-neutral-800 mt-2 dark:text-neutral-200">{item.badge.name}</h3>
                    <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">{item.badge.description}</p>
                    <p className="text-xs text-neutral-400 mt-2 dark:text-neutral-500">
                      Earned on {new Date(item.userBadge.awardedAt).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="statistics" className="space-y-6">
            <h2 className="text-xl font-heading font-semibold text-neutral-800 dark:text-neutral-200">Performance Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                      <div className="text-3xl font-bold text-primary">{submissionStats.total}</div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">Total Submissions</div>
                    </div>
                    
                    <div className="text-center p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                      <div className="text-3xl font-bold text-green-600">{submissionStats.graded}</div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">Graded Submissions</div>
                    </div>
                    
                    <div className="text-center p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                      <div className="text-3xl font-bold text-yellow-500">{submissionStats.avgScore}</div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">Average Score</div>
                    </div>
                    
                    <div className="text-center p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                      <div className="text-3xl font-bold text-blue-500">{submissionStats.total > 0 ? Math.round((submissionStats.onTime / submissionStats.total) * 100) : 0}%</div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">On-Time Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Learning Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary-100 p-2 rounded-full text-primary dark:bg-primary-900">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          Active Courses
                        </div>
                        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          {courseProgress.filter(c => c.status === 'active').length}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-2 rounded-full text-green-600 dark:bg-green-900 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          Completed Courses
                        </div>
                        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          {courseProgress.filter(c => c.status === 'completed').length}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="bg-yellow-100 p-2 rounded-full text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400">
                      <Award className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          Badges Earned
                        </div>
                        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          {badges?.length || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          Overall Progress
                        </div>
                        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          {overallProgress}%
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
