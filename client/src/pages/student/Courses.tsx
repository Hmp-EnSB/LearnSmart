import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import MainLayout from '@/components/layouts/MainLayout';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  tutor: {
    id: number;
    fullName: string;
  };
  published: boolean;
}

interface EnrolledCourse extends Course {
  status: string;
  progress: number;
}

export default function StudentCourses() {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch enrollments with courses
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['/api/enrollments?student=me'],
  });
  
  // Fetch available courses
  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['/api/courses?published=true'],
  });
  
  // Fetch student analytics
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['/api/analytics/student'],
  });
  
  // Process enrollments and courses
  useEffect(() => {
    if (enrollments && analytics) {
      const processedEnrollments = enrollments.map((enrollment: any) => ({
        ...enrollment.course,
        status: enrollment.status,
        progress: analytics.courseProgress[enrollment.course.id] || 0
      }));
      
      setEnrolledCourses(processedEnrollments);
    }
    
    if (courses && enrollments) {
      // Filter out courses that the student is already enrolled in
      const enrolledIds = enrollments.map((e: any) => e.course.id);
      const available = courses.filter((course: Course) => 
        !enrolledIds.includes(course.id) && course.published
      );
      
      setAvailableCourses(available);
      setFilteredCourses(available);
    }
  }, [enrollments, courses, analytics]);
  
  // Handle search
  useEffect(() => {
    if (availableCourses.length > 0) {
      if (searchQuery.trim() === '') {
        setFilteredCourses(availableCourses);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = availableCourses.filter(
          course => 
            course.title.toLowerCase().includes(query) || 
            course.description.toLowerCase().includes(query) ||
            (course.tutor?.fullName?.toLowerCase().includes(query))
        );
        setFilteredCourses(filtered);
      }
    }
  }, [searchQuery, availableCourses]);

  const handleEnroll = async (courseSlug: string) => {
    try {
      const response = await fetch(`/api/courses/${courseSlug}/enroll`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Refetch enrollments
        window.location.reload(); // Simplistic approach - would use queryClient.invalidateQueries in real app
      } else {
        const data = await response.json();
        console.error('Enrollment error:', data.message);
      }
    } catch (error) {
      console.error('Enrollment error:', error);
    }
  };

  const isLoading = loadingEnrollments || loadingCourses || loadingAnalytics;

  return (
    <MainLayout title="Courses">
      <Tabs defaultValue="enrolled" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="enrolled" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>My Courses</span>
          </TabsTrigger>
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span>Browse Courses</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="enrolled" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <p>Loading your courses...</p>
            ) : enrolledCourses.length === 0 ? (
              <div className="col-span-full text-center py-6">
                <h3 className="font-medium text-lg mb-2 text-neutral-800 dark:text-neutral-200">You haven't enrolled in any courses yet</h3>
                <p className="text-neutral-600 mb-4 dark:text-neutral-400">Explore our catalog and find courses that interest you</p>
                <Button onClick={() => document.querySelector('[data-value="browse"]')?.click()}>
                  Browse Courses
                </Button>
              </div>
            ) : (
              enrolledCourses.map(course => (
                <Card key={course.id} className="overflow-hidden">
                  <div className="h-40 bg-neutral-200 dark:bg-neutral-700">
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                      <span className="text-lg font-medium">{course.title.substring(0, 1)}</span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-heading font-semibold text-lg text-neutral-800 dark:text-neutral-200">{course.title}</h3>
                      <Badge variant={course.status === 'active' ? 'active' : course.status === 'completed' ? 'completed' : 'pending'}>
                        {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-neutral-600 text-sm dark:text-neutral-400">By {course.tutor?.fullName || 'Unknown Tutor'}</p>
                    
                    {course.status === 'active' && (
                      <div className="mt-4">
                        <ProgressBar value={course.progress} size="sm" />
                        <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-500">{course.progress}% complete</p>
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      {course.status === 'pending' ? (
                        <Badge variant="pending">Awaiting approval</Badge>
                      ) : (
                        <Link href={`/student/courses/${course.slug}`}>
                          <a className="text-primary hover:text-primary/90 font-medium text-sm">
                            {course.status === 'completed' ? 'Review' : 'Continue'}
                          </a>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="browse" className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <Input 
              placeholder="Search courses..." 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <p>Loading available courses...</p>
            ) : filteredCourses.length === 0 ? (
              <div className="col-span-full text-center py-6">
                <h3 className="font-medium text-lg mb-2 text-neutral-800 dark:text-neutral-200">No courses found</h3>
                <p className="text-neutral-600 dark:text-neutral-400">Try adjusting your search query</p>
              </div>
            ) : (
              filteredCourses.map(course => (
                <Card key={course.id} className="overflow-hidden">
                  <div className="h-40 bg-neutral-200 dark:bg-neutral-700">
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                      <span className="text-lg font-medium">{course.title.substring(0, 1)}</span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-heading font-semibold text-lg text-neutral-800 dark:text-neutral-200">{course.title}</h3>
                    <p className="text-neutral-600 text-sm mt-1 dark:text-neutral-400">By {course.tutor?.fullName || 'Unknown Tutor'}</p>
                    <p className="text-neutral-600 text-sm mt-2 line-clamp-2 dark:text-neutral-400">{course.description}</p>
                    
                    <div className="mt-4 flex justify-end">
                      <Button onClick={() => handleEnroll(course.slug)}>
                        Enroll
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
