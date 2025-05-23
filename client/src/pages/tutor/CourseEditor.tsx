import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseSchema, moduleSchema } from '@/lib/validation';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { z } from 'zod';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  GripVertical, 
  ClipboardList, 
  Calendar 
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

interface Module {
  id: number;
  courseId: number;
  title: string;
  content: string;
  order: number;
}

interface Assignment {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
}

type CourseFormValues = z.infer<typeof courseSchema>;
type ModuleFormValues = z.infer<typeof moduleSchema>;

export default function TutorCourseEditor() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [assignments, setAssignments] = useState<{[moduleId: number]: Assignment[]}>({});
  const [isNewCourse, setIsNewCourse] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [deletingModuleId, setDeletingModuleId] = useState<number | null>(null);
  const [moduleDeletionDialogOpen, setModuleDeletionDialogOpen] = useState(false);
  
  // Determine if this is a new course or editing an existing one
  useEffect(() => {
    setIsNewCourse(id === undefined);
  }, [id]);
  
  // Set up course form
  const courseForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      published: false
    }
  });
  
  // Set up module form
  const moduleForm = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      courseId: 0,
      title: '',
      content: '',
      order: 0
    }
  });
  
  // Fetch course data if editing
  const { data: courseData, isLoading: loadingCourse } = useQuery({
    queryKey: [`/api/courses/${id}`],
    enabled: !isNewCourse
  });
  
  // Set course data and load modules if editing
  useEffect(() => {
    if (!isNewCourse && courseData) {
      setCourse(courseData);
      
      // Set form values
      courseForm.reset({
        title: courseData.title,
        description: courseData.description,
        published: courseData.published
      });
      
      // Fetch modules for this course
      const fetchModules = async () => {
        try {
          const response = await fetch(`/api/modules?courseId=${courseData.id}`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const modulesData = await response.json();
            setModules(modulesData);
            
            // Fetch assignments for each module
            const assignmentsData: {[moduleId: number]: Assignment[]} = {};
            
            await Promise.all(
              modulesData.map(async (module: Module) => {
                const assignmentResponse = await fetch(`/api/assignments?moduleId=${module.id}`, {
                  credentials: 'include'
                });
                
                if (assignmentResponse.ok) {
                  const moduleAssignments = await assignmentResponse.json();
                  assignmentsData[module.id] = moduleAssignments;
                }
              })
            );
            
            setAssignments(assignmentsData);
          }
        } catch (error) {
          console.error('Error fetching modules:', error);
        }
      };
      
      fetchModules();
    }
  }, [isNewCourse, courseData, courseForm]);
  
  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      const response = await apiRequest('POST', '/api/courses', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Course created',
        description: 'Your course has been created successfully.',
      });
      navigate(`/tutor/courses/${data.id}/edit`);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to create course: ${error}`,
      });
    }
  });
  
  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: CourseFormValues }) => {
      const response = await apiRequest('PUT', `/api/courses/${id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      setCourse(data);
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${id}`] });
      toast({
        title: 'Course updated',
        description: 'Your course has been updated successfully.',
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
  
  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (data: ModuleFormValues) => {
      const response = await apiRequest('POST', '/api/modules', data);
      return response.json();
    },
    onSuccess: (data) => {
      setModules(prev => [...prev, data]);
      setShowModuleForm(false);
      moduleForm.reset({
        courseId: course?.id || 0,
        title: '',
        content: '',
        order: modules.length
      });
      toast({
        title: 'Module created',
        description: 'Your module has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to create module: ${error}`,
      });
    }
  });
  
  // Update module mutation
  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<ModuleFormValues> }) => {
      const response = await apiRequest('PUT', `/api/modules/${id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      setModules(prev => prev.map(module => module.id === data.id ? data : module));
      toast({
        title: 'Module updated',
        description: 'Your module has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update module: ${error}`,
      });
    }
  });
  
  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/modules/${id}`, undefined);
    },
    onSuccess: () => {
      setModules(prev => prev.filter(module => module.id !== deletingModuleId));
      toast({
        title: 'Module deleted',
        description: 'The module has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete module: ${error}`,
      });
    }
  });
  
  // Handle course form submission
  const handleCourseSubmit = async (values: CourseFormValues) => {
    setIsSaving(true);
    
    try {
      if (isNewCourse) {
        createCourseMutation.mutate(values);
      } else if (course) {
        updateCourseMutation.mutate({ id: course.id, data: values });
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle module form submission
  const handleModuleSubmit = (values: ModuleFormValues) => {
    if (!course) return;
    
    values.courseId = course.id;
    values.order = modules.length;
    
    createModuleMutation.mutate(values);
  };
  
  // Handle module deletion
  const confirmDeleteModule = (id: number) => {
    setDeletingModuleId(id);
    setModuleDeletionDialogOpen(true);
  };
  
  const handleDeleteModule = () => {
    if (deletingModuleId !== null) {
      deleteModuleMutation.mutate(deletingModuleId);
      setModuleDeletionDialogOpen(false);
      setDeletingModuleId(null);
    }
  };
  
  // Handle module reordering (placeholder)
  const moveModule = (index: number, direction: 'up' | 'down') => {
    const newModules = [...modules];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newModules.length) return;
    
    // Swap modules
    [newModules[index], newModules[newIndex]] = [newModules[newIndex], newModules[index]];
    
    // Update order property
    newModules[index].order = index;
    newModules[newIndex].order = newIndex;
    
    // Update in state
    setModules(newModules);
    
    // Update in the backend
    updateModuleMutation.mutate({ 
      id: newModules[index].id, 
      data: { order: newModules[index].order } 
    });
    updateModuleMutation.mutate({ 
      id: newModules[newIndex].id, 
      data: { order: newModules[newIndex].order } 
    });
  };
  
  // Initialize module form when adding a new module
  const initModuleForm = () => {
    if (!course) return;
    
    moduleForm.reset({
      courseId: course.id,
      title: '',
      content: '',
      order: modules.length
    });
    
    setShowModuleForm(true);
  };
  
  return (
    <MainLayout title={isNewCourse ? "Create Course" : "Edit Course"}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/tutor/courses')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          {!isNewCourse && course && (
            <div className="flex items-center gap-2">
              <Badge variant={course.published ? 'active' : 'pending'}>
                {course.published ? 'Published' : 'Draft'}
              </Badge>
              
              <Button 
                type="submit"
                form="course-form"
                className="flex items-center gap-2"
                disabled={isSaving}
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
        
        {loadingCourse && !isNewCourse ? (
          <div className="text-center py-8">
            <p>Loading course...</p>
          </div>
        ) : (
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Course Details</TabsTrigger>
              {!isNewCourse && <TabsTrigger value="modules">Modules & Content</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...courseForm}>
                    <form 
                      id="course-form" 
                      onSubmit={courseForm.handleSubmit(handleCourseSubmit)} 
                      className="space-y-4"
                    >
                      <FormField
                        control={courseForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course Title</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g. Introduction to Python Programming"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={courseForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course Description</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Provide a detailed description of your course..."
                                className="min-h-[150px] resize-y"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={courseForm.control}
                        name="published"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Published Status
                              </FormLabel>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {field.value 
                                  ? "Your course is public and can be enrolled in by students." 
                                  : "Your course is unpublished and only visible to you."}
                              </p>
                            </div>
                            <FormControl>
                              <Button
                                type="button"
                                variant={field.value ? "default" : "outline"}
                                onClick={() => field.onChange(!field.value)}
                              >
                                {field.value ? "Published" : "Unpublished"}
                              </Button>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {isNewCourse && (
                        <div className="pt-4">
                          <Button type="submit" className="w-full" disabled={isSaving}>
                            {isSaving ? 'Creating Course...' : 'Create Course'}
                          </Button>
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {!isNewCourse && (
              <TabsContent value="modules">
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Course Modules</CardTitle>
                      <Button 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={initModuleForm}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Module</span>
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {showModuleForm && (
                        <Card className="mb-6 border-primary/50">
                          <CardHeader>
                            <CardTitle className="text-lg">New Module</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Form {...moduleForm}>
                              <form 
                                onSubmit={moduleForm.handleSubmit(handleModuleSubmit)} 
                                className="space-y-4"
                              >
                                <FormField
                                  control={moduleForm.control}
                                  name="title"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Module Title</FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder="e.g. Introduction to Variables"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={moduleForm.control}
                                  name="content"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Module Content</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          {...field}
                                          placeholder="Enter module content here..."
                                          className="min-h-[150px] resize-y"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => setShowModuleForm(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button type="submit">Add Module</Button>
                                </div>
                              </form>
                            </Form>
                          </CardContent>
                        </Card>
                      )}
                      
                      {modules.length === 0 ? (
                        <div className="text-center py-8 border border-dashed rounded-lg">
                          <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                            No modules added yet
                          </p>
                          <Button 
                            variant="outline" 
                            className="flex items-center gap-2"
                            onClick={initModuleForm}
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Your First Module</span>
                          </Button>
                        </div>
                      ) : (
                        <Accordion type="single" collapsible className="w-full">
                          {modules
                            .sort((a, b) => a.order - b.order)
                            .map((module, index) => (
                              <AccordionItem key={module.id} value={`module-${module.id}`}>
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 mr-2 flex flex-col space-y-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6"
                                      onClick={() => moveModule(index, 'up')}
                                      disabled={index === 0}
                                    >
                                      <span className="sr-only">Move up</span>
                                      ↑
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6"
                                      onClick={() => moveModule(index, 'down')}
                                      disabled={index === modules.length - 1}
                                    >
                                      <span className="sr-only">Move down</span>
                                      ↓
                                    </Button>
                                  </div>
                                  
                                  <div className="flex items-center flex-grow">
                                    <GripVertical className="h-5 w-5 text-neutral-400 mr-2" />
                                    <div className="font-medium">
                                      Module {index + 1}:
                                    </div>
                                    <AccordionTrigger className="flex-grow">
                                      {module.title}
                                    </AccordionTrigger>
                                  </div>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 h-8 w-8 flex-shrink-0 mr-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmDeleteModule(module.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                <AccordionContent>
                                  <div className="pl-10 pt-4 pb-2 space-y-4">
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="text-sm font-medium mb-2">Module Content</h4>
                                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                          <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                                            {module.content}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <h4 className="text-sm font-medium">Assignments</h4>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="flex items-center gap-1 h-7 text-xs"
                                            onClick={() => setSelectedModuleId(module.id)}
                                          >
                                            <Plus className="h-3 w-3" />
                                            <span>Add Assignment</span>
                                          </Button>
                                        </div>
                                        
                                        {!assignments[module.id] || assignments[module.id].length === 0 ? (
                                          <div className="text-sm text-neutral-500 dark:text-neutral-400 italic">
                                            No assignments added to this module yet.
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            {assignments[module.id].map(assignment => (
                                              <div 
                                                key={assignment.id} 
                                                className="p-3 border rounded-lg flex items-center justify-between"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 dark:bg-neutral-700">
                                                    <ClipboardList className="h-4 w-4" />
                                                  </div>
                                                  <div>
                                                    <h5 className="font-medium text-neutral-800 dark:text-neutral-200">
                                                      {assignment.title}
                                                    </h5>
                                                    <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                                                      <Calendar className="h-3 w-3 mr-1" />
                                                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                                    </div>
                                                  </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                  <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7"
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                        </Accordion>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button 
                        type="submit"
                        form="course-form"
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Course
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
      
      {/* Module Deletion Confirmation Dialog */}
      <AlertDialog open={moduleDeletionDialogOpen} onOpenChange={setModuleDeletionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the module
              and all associated assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteModule}
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
