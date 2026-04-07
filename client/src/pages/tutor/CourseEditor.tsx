import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courseSchema, moduleSchema } from "@/lib/validation";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layouts/MainLayout";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { z } from "zod";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  ClipboardList,
  Calendar,
} from "lucide-react";

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
  type: "text" | "video" | "file" | "image" | "link";
  fileUrl?: string;
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
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<{
    [moduleId: number]: Assignment[];
  }>({});
  const [isNewCourse, setIsNewCourse] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [deletingModuleId, setDeletingModuleId] = useState<number | null>(null);
  const [moduleDeletionDialogOpen, setModuleDeletionDialogOpen] =
    useState(false);

  // Add validation check when component mounts
  useEffect(() => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to access the course editor.",
      });
      navigate("/login");
      return;
    }
    if (user.role !== "tutor" && user.role !== "admin") {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "You are not authorized to access the course editor.",
      });
      navigate("/");
      return;
    }
  }, [user, navigate, toast]);

  // Determine if this is a new course or editing an existing one
  useEffect(() => {
    setIsNewCourse(id === undefined);
  }, [id]);

  // Set up course form
  const courseForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      published: false,
    },
  });

  // Set up module form with updated schema
  const moduleForm = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      courseId: 0,
      title: "",
      content: "",
      order: 0,
      type: "text",
      file: undefined,
    },
  });

  // Fetch course data if editing
  const { data: courseData, isLoading: loadingCourse } = useQuery<Course>({
    queryKey: [`/api/courses/${id}`],
    enabled: !isNewCourse && !!id,
  });

  // Use React Query for modules data fetching
  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: [`/api/courses/${id}/modules`],
    enabled: !!id,
    queryFn: async () => {
      const response = await fetch(`/api/modules?courseId=${id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch modules: ${response.status} ${response.statusText}`,
        );
      }
      return response.json();
    },
  });

  // Set course data when editing
  useEffect(() => {
    if (!isNewCourse && courseData) {
      setCourse(courseData);
      // Set form values
      courseForm.reset({
        title: courseData.title,
        description: courseData.description,
        published: courseData.published,
      });
    }
  }, [isNewCourse, courseData, courseForm]);

  // Fetch assignments when modules change
  useEffect(() => {
    if (modules.length > 0) {
      const fetchAssignments = async () => {
        const assignmentsData: { [moduleId: number]: Assignment[] } = {};
        await Promise.all(
          modules.map(async (module: Module) => {
            try {
              const assignmentResponse = await fetch(
                `/api/assignments?moduleId=${module.id}`,
                {
                  credentials: "include",
                },
              );
              if (assignmentResponse.ok) {
                const moduleAssignments = await assignmentResponse.json();
                assignmentsData[module.id] = moduleAssignments;
              } else {
                console.warn(
                  `Failed to fetch assignments for module ${module.id}`,
                );
                assignmentsData[module.id] = [];
              }
            } catch (error) {
              console.error(
                `Error fetching assignments for module ${module.id}:`,
                error,
              );
              assignmentsData[module.id] = [];
            }
          }),
        );
        setAssignments(assignmentsData);
      };
      fetchAssignments();
    }
  }, [modules]);

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      const courseData = {
        ...data,
        tutorId: user?.id,
      };
      console.log("Creating course with data:", courseData);
      const response = await apiRequest("POST", "/api/courses", courseData);
      return response.json();
    },
    onSuccess: (data) => {
      setCourse(data); // Set the created course
      setIsNewCourse(false); // Mark as no longer new
      toast({
        title: "Course created successfully! 🎉",
        description: "Now you can add modules to make your course engaging.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tutor/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/tutor"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${data.id}/modules`],
      });
      // Update URL without navigation to enable modules tab
      window.history.replaceState({}, "", `/tutor/courses/${data.id}/edit`);
    },
    onError: (error) => {
      console.error("Course creation error:", error);
      toast({
        title: "Failed to create course",
        description:
          error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: CourseFormValues;
    }) => {
      const courseData = {
        ...data,
        tutorId: user?.id,
      };
      console.log("Updating course with data:", courseData);
      const response = await apiRequest(
        "PUT",
        `/api/courses/${id}`,
        courseData,
      );
      return response.json();
    },
    onSuccess: (data) => {
      setCourse(data);
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${id}`] });
      toast({
        title: "Course updated",
        description: "Your course has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Course update error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update course: ${error}`,
      });
    },
  });

  // Create module mutation with file upload support
  const createModuleMutation = useMutation({
    mutationFn: async (data: ModuleFormValues) => {
      // If there's a file, create FormData for file upload
      if (data.file) {
        const formData = new FormData();
        formData.append("courseId", data.courseId.toString());
        formData.append("title", data.title);
        formData.append("content", data.content);
        formData.append("order", data.order.toString());
        formData.append("type", data.type);
        formData.append("file", data.file);

        const response = await fetch("/api/modules", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to create module: ${response.statusText}`);
        }

        return response.json();
      } else {
        // No file, use regular JSON request
        const response = await apiRequest("POST", "/api/modules", data);
        return response.json();
      }
    },
    onSuccess: () => {
      setShowModuleForm(false);
      moduleForm.reset({
        courseId: course?.id || 0,
        title: "",
        content: "",
        order: modules.length,
        type: "text",
        file: undefined,
      });
      // Invalidate modules query to refetch data
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${course?.id}/modules`],
      });
      toast({
        title: "Module created",
        description: "Your module has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create module: ${error}`,
      });
    },
  });

  // Update module mutation
  const updateModuleMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<ModuleFormValues>;
    }) => {
      const response = await apiRequest("PUT", `/api/modules/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate modules query to refetch data
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${course?.id}/modules`],
      });
      toast({
        title: "Module updated",
        description: "Your module has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update module: ${error}`,
      });
    },
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/modules/${id}`, undefined);
    },
    onSuccess: () => {
      // Invalidate modules query to refetch data
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${course?.id}/modules`],
      });
      toast({
        title: "Module deleted",
        description: "The module has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete module: ${error}`,
      });
    },
  });

  // Handle course form submission
  const handleCourseSubmit = async (values: CourseFormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create or edit courses.",
      });
      return;
    }
    if (user.role !== "tutor" && user.role !== "admin") {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You are not authorized to create or edit courses.",
      });
      return;
    }
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

  // Handle module reordering
  const moveModule = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= modules.length) return;
    const moduleToMove = modules[index];
    const targetModule = modules[newIndex];
    // Update order in the backend
    updateModuleMutation.mutate({
      id: moduleToMove.id,
      data: { order: newIndex },
    });
    updateModuleMutation.mutate({
      id: targetModule.id,
      data: { order: index },
    });
  };

  // Initialize module form when adding a new module
  const initModuleForm = () => {
    if (!course) return;
    moduleForm.reset({
      courseId: course.id,
      title: "",
      content: "",
      order: modules.length,
      type: "text",
      file: undefined,
    });
    setShowModuleForm(true);
  };

  // Show loading state while checking authentication
  if (!user) {
    return (
      <MainLayout title="Course Editor">
        <div className="text-center py-8">
          <p>Loading...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isNewCourse ? "Create Course" : "Edit Course"}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/tutor/courses")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {!isNewCourse && course && (
            <div className="flex items-center gap-2">
              <Badge variant={course.published ? "active" : "pending"}>
                {course.published ? "Published" : "Draft"}
              </Badge>
              <Button
                type="submit"
                form="course-form"
                className="flex items-center gap-2"
                disabled={isSaving}
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
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
              <TabsTrigger value="modules">Modules & Content</TabsTrigger>
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
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={isSaving}
                          >
                            {isSaving ? "Creating Course..." : "Create Course"}
                          </Button>
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="modules">
              <div className="space-y-6">
                {isNewCourse ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                          Please create your course first to add modules.
                        </p>
                        <Button
                          onClick={() => {
                            // Switch to details tab
                            const detailsTab = document.querySelector(
                              '[value="details"]',
                            ) as HTMLElement;
                            detailsTab?.click();
                          }}
                          variant="outline"
                        >
                          Go to Course Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
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
                            <CardTitle className="text-lg">
                              New Module
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Form {...moduleForm}>
                              <form
                                onSubmit={moduleForm.handleSubmit(
                                  handleModuleSubmit,
                                )}
                                className="space-y-4"
                              >
                                {/* Module Type Selection */}
                                <FormField
                                  control={moduleForm.control}
                                  name="type"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Module Type</FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select module type" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="text">
                                            Text
                                          </SelectItem>
                                          <SelectItem value="video">
                                            Video
                                          </SelectItem>
                                          <SelectItem value="file">
                                            File
                                          </SelectItem>
                                          <SelectItem value="image">
                                            Image
                                          </SelectItem>
                                          <SelectItem value="link">
                                            Link
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                {/* File Upload Section */}
                                {["video", "file", "image"].includes(
                                  moduleForm.watch("type"),
                                ) && (
                                  <FormItem>
                                    <FormLabel>Upload File</FormLabel>
                                    <Input
                                      type="file"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file)
                                          moduleForm.setValue("file", file);
                                      }}
                                      accept={
                                        moduleForm.watch("type") === "video"
                                          ? "video/*"
                                          : moduleForm.watch("type") === "image"
                                            ? "image/*"
                                            : "*"
                                      }
                                    />
                                  </FormItem>
                                )}

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
                              <AccordionItem
                                key={module.id}
                                value={`module-${module.id}`}
                              >
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 mr-2 flex flex-col space-y-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => moveModule(index, "up")}
                                      disabled={index === 0}
                                    >
                                      <span className="sr-only">Move up</span>↑
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => moveModule(index, "down")}
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
                                      <Badge variant="outline" className="ml-2">
                                        {module.type}
                                      </Badge>
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
                                      {/* Display file URL if exists */}
                                      {module.fileUrl && (
                                        <div>
                                          <h4 className="text-sm font-medium mb-2">
                                            Attached File
                                          </h4>
                                          <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                            {module.type === "image" ? (
                                              <img
                                                src={module.fileUrl}
                                                alt={module.title}
                                                className="max-w-full h-auto rounded"
                                              />
                                            ) : module.type === "video" ? (
                                              <video
                                                src={module.fileUrl}
                                                controls
                                                className="max-w-full h-auto rounded"
                                              />
                                            ) : (
                                              <a
                                                href={module.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 underline"
                                              >
                                                Download File
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      <div>
                                        <h4 className="text-sm font-medium mb-2">
                                          Module Content
                                        </h4>
                                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                          <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                                            {module.content}
                                          </p>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <h4 className="text-sm font-medium">
                                            Assignments
                                          </h4>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex items-center gap-1 h-7 text-xs"
                                            onClick={() =>
                                              setSelectedModuleId(module.id)
                                            }
                                          >
                                            <Plus className="h-3 w-3" />
                                            <span>Add Assignment</span>
                                          </Button>
                                        </div>
                                        {!assignments[module.id] ||
                                        assignments[module.id].length === 0 ? (
                                          <div className="text-sm text-neutral-500 dark:text-neutral-400 italic">
                                            No assignments added to this module
                                            yet.
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            {assignments[module.id].map(
                                              (assignment) => (
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
                                                        <span>
                                                          Due:{" "}
                                                          {new Date(
                                                            assignment.dueDate,
                                                          ).toLocaleDateString()}
                                                        </span>
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
                                              ),
                                            )}
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
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
      {/* Module Deletion Confirmation Dialog */}
      <AlertDialog
        open={moduleDeletionDialogOpen}
        onOpenChange={setModuleDeletionDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              module and all associated assignments.
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
