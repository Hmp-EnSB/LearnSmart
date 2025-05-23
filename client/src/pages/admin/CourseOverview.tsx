import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { 
  Book, 
  Search, 
  Edit, 
  Trash, 
  Check, 
  X,
  Eye,
  BarChart
} from 'lucide-react';

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  published: boolean;
  createdAt: string;
  tutor: {
    id: number;
    fullName: string;
  };
  stats?: {
    modules: number;
    assignments: number;
    enrollments: number;
  };
}

export default function AdminCourseOverview() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [publishFilter, setPublishFilter] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseDetailsOpen, setCourseDetailsOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Fetch courses
  const { data: coursesData, isLoading, refetch: refetchCourses } = useQuery({
    queryKey: ['/api/courses'],
  });
  
  // Process courses data
  useEffect(() => {
    if (coursesData) {
      // Fetch additional stats for each course
      const enhancedCourses = Promise.all(
        coursesData.map(async (course: Course) => {
          try {
            // Fetch modules
            const modulesResponse = await fetch(`/api/modules?courseId=${course.id}`, {
              credentials: 'include'
            });
            
            let modules = [];
            if (modulesResponse.ok) {
              modules = await modulesResponse.json();
            }
            
            // Fetch assignments
            const assignmentsResponse = await fetch(`/api/assignments?courseId=${course.id}`, {
              credentials: 'include'
            });
            
            let assignments = [];
            if (assignmentsResponse.ok) {
              assignments = await assignmentsResponse.json();
            }
            
            // Fetch enrollments
            const enrollmentsResponse = await fetch(`/api/enrollments?courseId=${course.id}`, {
              credentials: 'include'
            });
            
            let enrollments = [];
            if (enrollmentsResponse.ok) {
              enrollments = await enrollmentsResponse.json();
            }
            
            // Add stats to course object
            course.stats = {
              modules: modules.length,
              assignments: assignments.length,
              enrollments: enrollments.length
            };
            
            return course;
          } catch (error) {
            console.error(`Error fetching stats for course ${course.id}:`, error);
            course.stats = {
              modules: 0,
              assignments: 0,
              enrollments: 0
            };
            return course;
          }
        })
      );
      
      enhancedCourses.then(data => {
        setCourses(data);
      });
    }
  }, [coursesData]);
  
  // Filter courses based on search query and publish status
  useEffect(() => {
    let filtered = courses;
    
    // Apply publish filter
    if (publishFilter === 'published') {
      filtered = filtered.filter(course => course.published);
    } else if (publishFilter === 'draft') {
      filtered = filtered.filter(course => !course.published);
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        course => 
          course.title.toLowerCase().includes(query) || 
          course.description.toLowerCase().includes(query) ||
          course.tutor.fullName.toLowerCase().includes(query)
      );
    }
    
    setFilteredCourses(filtered);
  }, [courses, searchQuery, publishFilter]);
  
  // Toggle course publish status mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: number, published: boolean }) => {
      const response = await apiRequest('PUT', `/api/courses/${id}/publish`, { published });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Course updated',
        description: 'Course publish status has been updated successfully.',
      });
      refetchCourses();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update course: ${error}`,
      });
    }
  });
  
  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/courses/${id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: 'Course deleted',
        description: 'The course has been deleted successfully.',
      });
      refetchCourses();
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete course: ${error}`,
      });
    }
  });
  
  // Handle publish status toggle
  const togglePublishStatus = (course: Course) => {
    togglePublishMutation.mutate({
      id: course.id,
      published: !course.published
    });
  };
  
  // Handle delete confirmation
  const confirmDeleteCourse = (course: Course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };
  
  // Handle delete execution
  const handleDeleteCourse = () => {
    if (courseToDelete) {
      deleteMutation.mutate(courseToDelete.id);
    }
  };
  
  // Handle view course details
  const viewCourseDetails = (course: Course) => {
    setSelectedCourse(course);
    setCourseDetailsOpen(true);
  };
  
  return (
    <MainLayout title="Course Overview">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <Input 
              placeholder="Search courses..." 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3">
            <div className="flex rounded-md overflow-hidden">
              <Button 
                variant={publishFilter === 'all' ? 'default' : 'outline'} 
                className="rounded-r-none border-r-0"
                onClick={() => setPublishFilter('all')}
              >
                All
              </Button>
              <Button 
                variant={publishFilter === 'published' ? 'default' : 'outline'} 
                className="rounded-none border-r-0"
                onClick={() => setPublishFilter('published')}
              >
                Published
              </Button>
              <Button 
                variant={publishFilter === 'draft' ? 'default' : 'outline'} 
                className="rounded-l-none"
                onClick={() => setPublishFilter('draft')}
              >
                Draft
              </Button>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">Courses</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Book className="h-3 w-3" />
                <span>Total: {filteredCourses.length}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p>Loading courses...</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                  <Book className="h-6 w-6 text-neutral-500" />
                </div>
                <h3 className="text-lg font-medium mb-1">No courses found</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search query or filters' 
                    : 'No courses match the selected criteria'}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                  <thead className="bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
                        Course
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
                        Tutor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
                        Stats
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200 dark:bg-neutral-800 dark:divide-neutral-700">
                    {filteredCourses.map(course => (
                      <tr key={course.id}>
                        <td className="px-6 py-4">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-200 truncate">
                              {course.title}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                              Created: {new Date(course.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-900 dark:text-neutral-200">
                            {course.tutor.fullName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-3 text-xs">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-300">
                              {course.stats?.modules || 0} Modules
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded dark:bg-green-900 dark:text-green-300">
                              {course.stats?.assignments || 0} Assignments
                            </span>
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded dark:bg-purple-900 dark:text-purple-300">
                              {course.stats?.enrollments || 0} Students
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={course.published ? 'active' : 'pending'}
                            className="inline-flex items-center"
                          >
                            {course.published ? (
                              <><Check className="h-3 w-3 mr-1" /> Published</>
                            ) : (
                              <><X className="h-3 w-3 mr-1" /> Draft</>
                            )}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => viewCourseDetails(course)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant={course.published ? 'outline' : 'secondary'}
                              size="sm"
                              onClick={() => togglePublishStatus(course)}
                            >
                              {course.published ? (
                                <><X className="h-4 w-4 mr-1" /> Unpublish</>
                              ) : (
                                <><Check className="h-4 w-4 mr-1" /> Publish</>
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => confirmDeleteCourse(course)}
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Course Details Dialog */}
      <Dialog open={courseDetailsOpen} onOpenChange={setCourseDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Course Details</DialogTitle>
          </DialogHeader>
          
          {selectedCourse && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{selectedCourse.title}</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                    Created by {selectedCourse.tutor.fullName} on {new Date(selectedCourse.createdAt).toLocaleDateString()}
                  </p>
                  <Badge variant={selectedCourse.published ? 'active' : 'pending'}>
                    {selectedCourse.published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => togglePublishStatus(selectedCourse)}>
                    {selectedCourse.published ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => {
                    setCourseDetailsOpen(false);
                    confirmDeleteCourse(selectedCourse);
                  }}>
                    Delete
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                  {selectedCourse.description}
                </p>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-4">Course Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm text-neutral-500 dark:text-neutral-400">Modules</h4>
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                        <Book className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold mt-2">{selectedCourse.stats?.modules || 0}</p>
                  </div>
                  
                  <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm text-neutral-500 dark:text-neutral-400">Assignments</h4>
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 dark:bg-green-900 dark:text-green-400">
                        <Edit className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold mt-2">{selectedCourse.stats?.assignments || 0}</p>
                  </div>
                  
                  <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm text-neutral-500 dark:text-neutral-400">Enrollments</h4>
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 dark:bg-purple-900 dark:text-purple-400">
                        <BarChart className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold mt-2">{selectedCourse.stats?.enrollments || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the course "{courseToDelete?.title}"? This action cannot be undone 
              and will remove all associated modules, assignments, and student enrollments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCourse}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}