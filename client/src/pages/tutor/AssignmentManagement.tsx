import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { assignmentSchema } from '@/lib/validation';
import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ClipboardList, 
  Plus, 
  Calendar, 
  Clock,
  SearchIcon,
  CheckCircle,
  AlertCircle,
  ListTodo,
  Pencil,
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface Course {
  id: number;
  title: string;
  slug: string;
}

interface Module {
  id: number;
  courseId: number;
  title: string;
  order: number;
}

interface Assignment {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  module?: {
    title: string;
    courseId: number;
  };
  course?: {
    id: number;
    title: string;
  };
  submissionsCount?: number;
  gradedCount?: number;
}

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

export default function TutorAssignmentManagement() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<{[courseId: number]: Module[]}>({});
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set up assignment form
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      moduleId: 0,
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      maxScore: 100
    }
  });
  
  // Fetch courses created by this tutor
  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ['/api/courses?tutorId=me'],
  });
  
  // Process courses data
  useEffect(() => {
    if (coursesData) {
      setCourses(coursesData);
      
      // Fetch modules for each course
      coursesData.forEach(async (course: Course) => {
        try {
          const response = await fetch(`/api/modules?courseId=${course.id}`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const modulesData = await response.json();
            setModules(prev => ({
              ...prev,
              [course.id]: modulesData
            }));
          }
        } catch (error) {
          console.error(`Error fetching modules for course ${course.id}:`, error);
        }
      });
    }
  }, [coursesData]);
  
  // Fetch assignments for the selected course or all courses
  const { data: assignmentsData, isLoading: loadingAssignments, refetch: refetchAssignments } = useQuery({
    queryKey: [
      selectedCourse === 'all' 
        ? '/api/assignments' 
        : `/api/assignments?courseId=${selectedCourse}`
    ],
  });
  
  // Process assignments data
  useEffect(() => {
    if (assignmentsData) {
      // Fetch additional details for each assignment
      const enhancedAssignments = Promise.all(
        assignmentsData.map(async (assignment: Assignment) => {
          try {
            // Fetch module details
            const moduleResponse = await fetch(`/api/modules?moduleId=${assignment.moduleId}`, {
              credentials: 'include'
            });
            
            if (moduleResponse.ok) {
              const moduleData = await moduleResponse.json();
              if (moduleData.length > 0) {
                assignment.module = moduleData[0];
                
                // Fetch course details
                const courseResponse = await fetch(`/api/courses/${moduleData[0].courseId}`, {
                  credentials: 'include'
                });
                
                if (courseResponse.ok) {
                  const courseData = await courseResponse.json();
                  assignment.course = courseData;
                }
              }
            }
            
            // Fetch submission counts
            const submissionsResponse = await fetch(`/api/submissions?assignmentId=${assignment.id}`, {
              credentials: 'include'
            });
            
            if (submissionsResponse.ok) {
              const submissionsData = await submissionsResponse.json();
              assignment.submissionsCount = submissionsData.length;
              assignment.gradedCount = submissionsData.filter((s: any) => s.graded).length;
            }
            
            return assignment;
          } catch (error) {
            console.error(`Error fetching details for assignment ${assignment.id}:`, error);
            return assignment;
          }
        })
      );
      
      enhancedAssignments.then(data => {
        setAssignments(data);
      });
    }
  }, [assignmentsData]);
  
  // Filter assignments based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAssignments(assignments);
    } else {
      const query = searchQuery.toLowerCase();
      
      const filtered = assignments.filter(assignment => 
        assignment.title.toLowerCase().includes(query) || 
        assignment.description.toLowerCase().includes(query) ||
        assignment.course?.title.toLowerCase().includes(query) ||
        assignment.module?.title.toLowerCase().includes(query)
      );
      
      setFilteredAssignments(filtered);
    }
  }, [searchQuery, assignments]);
  
  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentFormValues) => {
      const response = await apiRequest('POST', '/api/assignments', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Assignment created',
        description: 'Your assignment has been created successfully.',
      });
      setIsDialogOpen(false);
      form.reset();
      refetchAssignments();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to create assignment: ${error}`,
      });
    }
  });
  
  // Handle course selection change
  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
  };
  
  // Handle dialog open/close
  const openDialog = () => {
    form.reset();
    setIsDialogOpen(true);
  };
  
  // Handle assignment form submission
  const handleSubmit = (values: AssignmentFormValues) => {
    if (values.moduleId === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a module for this assignment.',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Format date to ISO string if it's not already
    if (typeof values.dueDate === 'string' && !values.dueDate.includes('T')) {
      values.dueDate = new Date(`${values.dueDate}T23:59:59`).toISOString();
    }
    
    createAssignmentMutation.mutate(values);
    setIsSubmitting(false);
  };
  
  const isLoading = loadingCourses || loadingAssignments;
  const selectedCourseId = selectedCourse !== 'all' ? parseInt(selectedCourse, 10) : null;
  const moduleOptions = selectedCourseId && modules[selectedCourseId] ? modules[selectedCourseId] : [];
  
  // Calculate stats for the current view
  const totalAssignments = filteredAssignments.length;
  const pendingGrading = filteredAssignments.reduce((count, assignment) => {
    const pending = (assignment.submissionsCount || 0) - (assignment.gradedCount || 0);
    return count + pending;
  }, 0);
  const upcomingDue = filteredAssignments.filter(assignment => {
    const dueDate = new Date(assignment.dueDate);
    const today = new Date();
    return dueDate > today;
  }).length;

  return (
    <MainLayout title="Assignment Management">
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
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <Input 
                placeholder="Search assignments..." 
                className="pl-10" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <Button className="flex items-center gap-2" onClick={openDialog}>
            <Plus className="h-4 w-4" />
            <span>Create Assignment</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Assignments</p>
                <p className="text-3xl font-bold text-primary mt-1">{totalAssignments}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary dark:bg-primary-900">
                <ClipboardList className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Pending Grading</p>
                <p className="text-3xl font-bold text-secondary-500 mt-1">{pendingGrading}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-500 dark:bg-secondary-900 dark:text-secondary-400">
                <ListTodo className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Upcoming Due</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{upcomingDue}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 dark:bg-green-900 dark:text-green-400">
                <Calendar className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="past">Past Due</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="pt-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <p>Loading assignments...</p>
                  </div>
                ) : filteredAssignments.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-lg">
                    <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                      <ClipboardList className="h-6 w-6 text-neutral-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No assignments found</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                      {searchQuery ? 'Try adjusting your search query' : 'Create your first assignment to get started'}
                    </p>
                    {!searchQuery && (
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        onClick={openDialog}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Assignment</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAssignments.map(assignment => (
                      <AssignmentItem key={assignment.id} assignment={assignment} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="active" className="pt-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <p>Loading assignments...</p>
                  </div>
                ) : filteredAssignments.filter(a => new Date(a.dueDate) > new Date()).length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-lg">
                    <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                      <ClipboardList className="h-6 w-6 text-neutral-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No active assignments</h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      All assignments have passed their due dates
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAssignments
                      .filter(a => new Date(a.dueDate) > new Date())
                      .map(assignment => (
                        <AssignmentItem key={assignment.id} assignment={assignment} />
                      ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="past" className="pt-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <p>Loading assignments...</p>
                  </div>
                ) : filteredAssignments.filter(a => new Date(a.dueDate) <= new Date()).length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-lg">
                    <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                      <ClipboardList className="h-6 w-6 text-neutral-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No past due assignments</h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      All assignments are still active
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAssignments
                      .filter(a => new Date(a.dueDate) <= new Date())
                      .map(assignment => (
                        <AssignmentItem key={assignment.id} assignment={assignment} />
                      ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Create Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Assignment</DialogTitle>
            <DialogDescription>
              Create a new assignment for your students to complete.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {selectedCourseId === null && (
                <FormField
                  control={form.control}
                  name="moduleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select
                        onValueChange={(value) => setSelectedCourse(value)}
                        value={selectedCourse}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map(course => (
                            <SelectItem key={course.id} value={String(course.id)}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="moduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value, 10))}
                      value={field.value ? String(field.value) : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a module" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {moduleOptions.map(module => (
                          <SelectItem key={module.id} value={String(module.id)}>
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignment Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter assignment title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Enter assignment description" 
                        className="min-h-[100px] resize-y"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          value={typeof field.value === 'string' 
                            ? field.value.split('T')[0] 
                            : field.value instanceof Date 
                              ? field.value.toISOString().split('T')[0] 
                              : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maxScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Score</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={1}
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 100)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Assignment'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

// Assignment Item Component
function AssignmentItem({ assignment }: { assignment: Assignment }) {
  const isDueSoon = () => {
    const dueDate = new Date(assignment.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };
  
  const isPastDue = () => {
    const dueDate = new Date(assignment.dueDate);
    const today = new Date();
    return dueDate < today;
  };
  
  const pendingSubmissions = (assignment.submissionsCount || 0) - (assignment.gradedCount || 0);
  
  return (
    <Card>
      <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 dark:bg-neutral-800">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-neutral-800 dark:text-neutral-200">{assignment.title}</h3>
              {isDueSoon() && (
                <Badge variant="urgent" className="flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  <span>Due Soon</span>
                </Badge>
              )}
              {isPastDue() && (
                <Badge variant="pending">Past Due</Badge>
              )}
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {assignment.course?.title} • {assignment.module?.title}
            </div>
            <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
              <Clock className="h-3 w-3 mx-1 ml-3" />
              <span>{new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-end md:self-center">
          <div className="text-sm flex flex-col items-end">
            <div className="flex items-center gap-1">
              <span className="text-neutral-600 dark:text-neutral-400">Max Score:</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">{assignment.maxScore}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-neutral-600 dark:text-neutral-400">Submissions:</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                {assignment.submissionsCount || 0}
              </span>
              {pendingSubmissions > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {pendingSubmissions} to grade
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
            >
              <Pencil className="h-3 w-3" />
              <span>Edit</span>
            </Button>
            <Link href={`/tutor/assignments/${assignment.id}/submissions`}>
              <Button size="sm" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>Grade</span>
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
