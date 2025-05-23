import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CheckCircle, 
  XCircle, 
  UserPlus, 
  Clock,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Course {
  id: number;
  title: string;
  slug: string;
}

interface Student {
  id: number;
  fullName: string;
  username: string;
  email: string;
}

interface Enrollment {
  id: number;
  courseId: number;
  studentId: number;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  requestedAt: string;
  updatedAt: string;
  student: Student;
  course?: Course;
}

export default function TutorEnrollmentRequests() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [enrollments, setEnrollments] = useState<{[key: string]: Enrollment[]}>({
    pending: [],
    active: [],
    rejected: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEnrollments, setFilteredEnrollments] = useState<{[key: string]: Enrollment[]}>({
    pending: [],
    active: [],
    rejected: []
  });

  // Fetch courses created by this tutor
  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ['/api/courses?tutorId=me'],
  });
  
  // Process courses data
  useEffect(() => {
    if (coursesData) {
      setCourses(coursesData);
    }
  }, [coursesData]);
  
  // Fetch enrollments for the selected course or all courses
  const { data: enrollmentsData, isLoading: loadingEnrollments, refetch: refetchEnrollments } = useQuery({
    queryKey: [
      selectedCourse === 'all' 
        ? '/api/enrollments' 
        : `/api/enrollments?courseId=${selectedCourse}`
    ],
  });
  
  // Process enrollments data
  useEffect(() => {
    if (enrollmentsData) {
      // Group enrollments by status
      const grouped = {
        pending: [] as Enrollment[],
        active: [] as Enrollment[],
        rejected: [] as Enrollment[]
      };
      
      enrollmentsData.forEach((enrollment: Enrollment) => {
        if (enrollment.status === 'pending') {
          grouped.pending.push(enrollment);
        } else if (enrollment.status === 'active' || enrollment.status === 'completed') {
          grouped.active.push(enrollment);
        } else if (enrollment.status === 'rejected') {
          grouped.rejected.push(enrollment);
        }
      });
      
      setEnrollments(grouped);
    }
  }, [enrollmentsData]);
  
  // Filter enrollments based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEnrollments(enrollments);
    } else {
      const query = searchQuery.toLowerCase();
      
      const filtered = {
        pending: enrollments.pending.filter(e => 
          e.student.fullName.toLowerCase().includes(query) || 
          e.student.email.toLowerCase().includes(query) ||
          e.student.username.toLowerCase().includes(query)
        ),
        active: enrollments.active.filter(e => 
          e.student.fullName.toLowerCase().includes(query) || 
          e.student.email.toLowerCase().includes(query) ||
          e.student.username.toLowerCase().includes(query)
        ),
        rejected: enrollments.rejected.filter(e => 
          e.student.fullName.toLowerCase().includes(query) || 
          e.student.email.toLowerCase().includes(query) ||
          e.student.username.toLowerCase().includes(query)
        )
      };
      
      setFilteredEnrollments(filtered);
    }
  }, [searchQuery, enrollments]);
  
  // Update enrollment status mutation
  const updateEnrollmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      await apiRequest('PUT', `/api/enrollments/${id}`, { status });
    },
    onSuccess: () => {
      refetchEnrollments();
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/tutor'] });
      toast({
        title: 'Enrollment updated',
        description: 'The enrollment status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update enrollment: ${error}`,
      });
    }
  });
  
  // Handle course selection change
  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
  };
  
  // Handle enrollment approval/rejection
  const updateEnrollmentStatus = (id: number, status: 'active' | 'rejected') => {
    updateEnrollmentMutation.mutate({ id, status });
  };
  
  const isLoading = loadingCourses || loadingEnrollments;

  return (
    <MainLayout title="Enrollment Management">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <Select value={selectedCourse} onValueChange={handleCourseChange}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={String(course.id)}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <Input 
                placeholder="Search students..." 
                className="pl-10" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Badge variant="pending" className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>Pending: {filteredEnrollments.pending.length}</span>
            </Badge>
            <Badge variant="active" className="flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              <span>Active: {filteredEnrollments.active.length}</span>
            </Badge>
          </div>
        </div>
        
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Pending</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Active</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <span>Rejected</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <p>Loading enrollment requests...</p>
                </CardContent>
              </Card>
            ) : filteredEnrollments.pending.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-neutral-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No pending requests</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">All enrollment requests have been handled.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredEnrollments.pending.map(enrollment => (
                  <Card key={enrollment.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 dark:bg-neutral-800">
                            <UserPlus className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium text-neutral-800 dark:text-neutral-200">
                              {enrollment.student.fullName}
                            </h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              {enrollment.student.email} • Requested {new Date(enrollment.requestedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                          <div className="text-sm font-medium text-neutral-600 dark:text-neutral-300 mr-2">
                            Course: {enrollment.course?.title || `Course #${enrollment.courseId}`}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => updateEnrollmentStatus(enrollment.id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => updateEnrollmentStatus(enrollment.id, 'active')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active">
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <p>Loading active enrollments...</p>
                </CardContent>
              </Card>
            ) : filteredEnrollments.active.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-neutral-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No active enrollments</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {selectedCourse === 'all' 
                      ? 'There are no active enrollments in any of your courses yet.' 
                      : 'There are no active enrollments in this course yet.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Enrollments</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border rounded-md">
                      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                        <thead className="bg-neutral-50 dark:bg-neutral-800">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
                              Student
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
                              Course
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
                              Enrolled On
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200 dark:bg-neutral-800 dark:divide-neutral-700">
                          {filteredEnrollments.active.map(enrollment => (
                            <tr key={enrollment.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 dark:bg-neutral-700">
                                    {enrollment.student.fullName.charAt(0)}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-200">
                                      {enrollment.student.fullName}
                                    </div>
                                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                      {enrollment.student.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-neutral-900 dark:text-neutral-200">
                                  {enrollment.course?.title || `Course #${enrollment.courseId}`}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                  {new Date(enrollment.updatedAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <Badge variant="active">Active</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="rejected">
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <p>Loading rejected enrollments...</p>
                </CardContent>
              </Card>
            ) : filteredEnrollments.rejected.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-neutral-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No rejected enrollments</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    You haven't rejected any enrollment requests yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Rejected Enrollments</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border rounded-md">
                      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                        <thead className="bg-neutral-50 dark:bg-neutral-800">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
                              Student
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
                              Course
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
                              Rejected On
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200 dark:bg-neutral-800 dark:divide-neutral-700">
                          {filteredEnrollments.rejected.map(enrollment => (
                            <tr key={enrollment.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 dark:bg-neutral-700">
                                    {enrollment.student.fullName.charAt(0)}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-200">
                                      {enrollment.student.fullName}
                                    </div>
                                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                      {enrollment.student.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-neutral-900 dark:text-neutral-200">
                                  {enrollment.course?.title || `Course #${enrollment.courseId}`}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                  {new Date(enrollment.updatedAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateEnrollmentStatus(enrollment.id, 'active')}
                                >
                                  Approve
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
