import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  PlusCircle, 
  MoreVertical, 
  Edit, 
  Trash, 
  Eye, 
  Book, 
  Users, 
  ClipboardList
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
}

export default function TutorCourseManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null);
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);
  
  // Fetch courses created by this tutor
  const { data, isLoading } = useQuery({
    queryKey: ['/api/courses?tutorId=me'],
  });
  
  // Set up course publishing/unpublishing mutation
  const publishMutation = useMutation({
    mutationFn: async ({ id, publish }: { id: number, publish: boolean }) => {
      await apiRequest('PUT', `/api/courses/${id}/publish`, { published: publish });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses?tutorId=me'] });
      toast({
        title: 'Course updated',
        description: 'Course publishing status has been updated.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update course: ${error}`,
      });
    }
  });
  
  // Set up course deletion mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/courses/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses?tutorId=me'] });
      toast({
        title: 'Course deleted',
        description: 'The course has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete course: ${error}`,
      });
    }
  });
  
  // Process courses data
  useEffect(() => {
    if (data) {
      setCourses(data);
    }
  }, [data]);
  
  // Filter courses based on search query
  useEffect(() => {
    if (courses.length > 0) {
      if (searchQuery.trim() === '') {
        setFilteredCourses(courses);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = courses.filter(
          course => 
            course.title.toLowerCase().includes(query) || 
            course.description.toLowerCase().includes(query)
        );
        setFilteredCourses(filtered);
      }
    } else {
      setFilteredCourses([]);
    }
  }, [searchQuery, courses]);
  
  const handlePublishToggle = (id: number, currentStatus: boolean) => {
    publishMutation.mutate({ id, publish: !currentStatus });
  };
  
  const confirmDelete = (id: number) => {
    setDeletingCourseId(id);
    setDeletionDialogOpen(true);
  };
  
  const handleDelete = () => {
    if (deletingCourseId !== null) {
      deleteMutation.mutate(deletingCourseId);
      setDeletionDialogOpen(false);
      setDeletingCourseId(null);
    }
  };

  return (
    <MainLayout title="Course Management">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <Input 
              placeholder="Search courses..." 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Link href="/tutor/courses/new">
            <Button className="flex items-center gap-2 w-full sm:w-auto">
              <PlusCircle className="h-4 w-4" />
              <span>Create Course</span>
            </Button>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Book className="h-8 w-8 text-primary" />
              </div>
              
              {courses.length === 0 ? (
                <>
                  <h3 className="text-lg font-medium mb-2 text-neutral-800 dark:text-neutral-200">No courses yet</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">Create your first course to get started</p>
                  <Link href="/tutor/courses/new">
                    <Button className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      <span>Create Course</span>
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-2 text-neutral-800 dark:text-neutral-200">No matching courses</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">Try adjusting your search query</p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-4">
                    <div className="p-6 md:col-span-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-heading font-semibold text-lg text-neutral-800 dark:text-neutral-200">
                              {course.title}
                            </h3>
                            <Badge variant={course.published ? 'active' : 'pending'}>
                              {course.published ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                          <p className="text-neutral-600 text-sm line-clamp-2 dark:text-neutral-400 mb-4">
                            {course.description}
                          </p>
                        </div>
                        
                        <div className="md:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/tutor/courses/${course.id}/edit`}>
                                  <a className="flex items-center gap-2 cursor-pointer">
                                    <Edit className="h-4 w-4" />
                                    <span>Edit</span>
                                  </a>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handlePublishToggle(course.id, course.published)}
                                className="flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                <span>{course.published ? 'Unpublish' : 'Publish'}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => confirmDelete(course.id)}
                                className="flex items-center gap-2 text-destructive"
                              >
                                <Trash className="h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Book className="h-4 w-4 text-neutral-500" />
                          <span className="text-neutral-600 dark:text-neutral-400">Created:</span>
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">
                            {new Date(course.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-neutral-500" />
                          <span className="text-neutral-600 dark:text-neutral-400">Enrollments:</span>
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">0</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <ClipboardList className="h-4 w-4 text-neutral-500" />
                          <span className="text-neutral-600 dark:text-neutral-400">Modules:</span>
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">0</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="hidden md:flex md:flex-col md:items-center md:justify-center p-6 bg-neutral-50 dark:bg-neutral-800 gap-2">
                      <Link href={`/tutor/courses/${course.id}/edit`}>
                        <Button variant="outline" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      
                      <Button 
                        variant={course.published ? "outline" : "default"}
                        className="w-full"
                        onClick={() => handlePublishToggle(course.id, course.published)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {course.published ? 'Unpublish' : 'Publish'}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => confirmDelete(course.id)}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletionDialogOpen} onOpenChange={setDeletionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course
              and all associated data including modules, assignments, and enrollments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
