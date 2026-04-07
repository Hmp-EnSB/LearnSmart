import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ModuleForm, { ModuleFormData } from "@/components/ModuleForm";
import {
  PlusCircle,
  Edit,
  Trash2,
  FileText,
  Video,
  Link as LinkIcon,
  File,
  Image,
  Download,
  Eye,
  EyeOff,
  Move,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  ExternalLink,
} from "lucide-react";

interface Module {
  id: number;
  title: string;
  description: string;
  content: string;
  type: "text" | "video" | "link" | "file" | "image" | "pdf" | "audio";
  orderIndex: number;
  isPublished: boolean;
  courseId: number;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  isPublished: boolean;
  modules: Module[];
}

export default function CourseModules() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [moduleForm, setModuleForm] = useState<ModuleFormData>({
    title: "",
    description: "",
    content: "",
    type: "text",
    file: null,
  });

  // Fetch course with modules using React Query
  const { data: course, isLoading } = useQuery<Course>({
    queryKey: [`/api/courses/${slug}/modules`],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${slug}/modules`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch course modules");
      }
      return response.json();
    },
    enabled: !!slug,
  });

  // Fetch modules separately for better caching
  const { data: modules } = useQuery<Module[]>({
    queryKey: [`/api/courses/${slug}/modules/list`],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${slug}/modules/list`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch modules");
      }
      return response.json();
    },
    enabled: !!slug,
  });

  // File upload function
  const uploadFile = async (
    file: File,
  ): Promise<{ url: string; fileName: string; fileSize: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", moduleForm.type);
    formData.append("courseSlug", slug || "");

    const response = await fetch("/api/upload/module-file", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload file");
    }

    return response.json();
  };

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: ModuleFormData) => {
      let fileData = null;

      // Upload file if present
      if (
        moduleData.file &&
        ["video", "audio", "image", "pdf", "file"].includes(moduleData.type)
      ) {
        setUploadingFile(true);
        try {
          fileData = await uploadFile(moduleData.file);
        } finally {
          setUploadingFile(false);
        }
      }

      const payload = {
        title: moduleData.title,
        description: moduleData.description,
        content: moduleData.content,
        type: moduleData.type,
        duration: moduleData.duration,
        ...(fileData && {
          fileUrl: fileData.url,
          fileName: fileData.fileName,
          fileSize: fileData.fileSize,
        }),
      };

      const response = await fetch(`/api/courses/${slug}/modules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create module");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${slug}/modules`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${slug}/modules/list`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${slug}`],
      });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Error creating module:", error);
      alert(error.message || "Failed to create module");
    },
  });

  // Update module mutation
  const updateModuleMutation = useMutation({
    mutationFn: async ({
      moduleId,
      moduleData,
    }: {
      moduleId: number;
      moduleData: ModuleFormData;
    }) => {
      let fileData = null;

      // Upload new file if present
      if (
        moduleData.file &&
        ["video", "audio", "image", "pdf", "file"].includes(moduleData.type)
      ) {
        setUploadingFile(true);
        try {
          fileData = await uploadFile(moduleData.file);
        } finally {
          setUploadingFile(false);
        }
      }

      const payload = {
        title: moduleData.title,
        description: moduleData.description,
        content: moduleData.content,
        type: moduleData.type,
        duration: moduleData.duration,
        ...(fileData && {
          fileUrl: fileData.url,
          fileName: fileData.fileName,
          fileSize: fileData.fileSize,
        }),
      };

      const response = await fetch(`/api/modules/${moduleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update module");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${slug}/modules`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${slug}/modules/list`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${slug}`],
      });
      setEditingModule(null);
      resetForm();
    },
    onError: (error) => {
      console.error("Error updating module:", error);
      alert(error.message || "Failed to update module");
    },
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      const response = await fetch(`/api/modules/${moduleId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete module");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${slug}/modules`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${slug}/modules/list`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${slug}`],
      });
    },
    onError: (error) => {
      console.error("Error deleting module:", error);
      alert(error.message || "Failed to delete module");
    },
  });

  // Toggle module publish status
  const togglePublishMutation = useMutation({
    mutationFn: async ({
      moduleId,
      isPublished,
    }: {
      moduleId: number;
      isPublished: boolean;
    }) => {
      const response = await fetch(`/api/modules/${moduleId}/publish`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ isPublished }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update module status");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${slug}/modules`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${slug}/modules/list`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${slug}`],
      });
    },
    onError: (error) => {
      console.error("Error updating module status:", error);
      alert(error.message || "Failed to update module status");
    },
  });

  // Reorder modules mutation
  const reorderModulesMutation = useMutation({
    mutationFn: async (moduleIds: number[]) => {
      const response = await fetch(`/api/courses/${slug}/modules/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ moduleIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reorder modules");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${slug}/modules`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/courses/${slug}/modules/list`],
      });
    },
  });

  const resetForm = () => {
    setModuleForm({
      title: "",
      description: "",
      content: "",
      type: "text",
      file: null,
    });
  };

  const handleCreateModule = () => {
    if (!moduleForm.title.trim()) {
      alert("Please enter a module title");
      return;
    }
    createModuleMutation.mutate(moduleForm);
  };

  const handleUpdateModule = () => {
    if (!editingModule || !moduleForm.title.trim()) {
      alert("Please enter a module title");
      return;
    }
    updateModuleMutation.mutate({
      moduleId: editingModule.id,
      moduleData: moduleForm,
    });
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleForm({
      title: module.title,
      description: module.description,
      content: module.content,
      type: module.type,
      file: null,
      duration: module.duration,
    });
  };

  const handleDeleteModule = (moduleId: number) => {
    if (
      confirm(
        "Are you sure you want to delete this module? This action cannot be undone.",
      )
    ) {
      deleteModuleMutation.mutate(moduleId);
    }
  };

  const handleTogglePublish = (moduleId: number, currentStatus: boolean) => {
    togglePublishMutation.mutate({
      moduleId,
      isPublished: !currentStatus,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        alert("File size must be less than 50MB");
        return;
      }

      // Validate file type
      const validTypes: Record<string, string[]> = {
        video: [
          "video/mp4",
          "video/avi",
          "video/mov",
          "video/wmv",
          "video/webm",
        ],
        audio: [
          "audio/mp3",
          "audio/wav",
          "audio/ogg",
          "audio/m4a",
          "audio/aac",
        ],
        image: [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/svg+xml",
        ],
        pdf: ["application/pdf"],
      };

      if (moduleForm.type !== "file" && validTypes[moduleForm.type]) {
        if (!validTypes[moduleForm.type].includes(file.type)) {
          alert(`Invalid file type for ${moduleForm.type} module`);
          return;
        }
      }

      setModuleForm({ ...moduleForm, file });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "audio":
        return <PlayCircle className="h-4 w-4" />;
      case "link":
        return <LinkIcon className="h-4 w-4" />;
      case "file":
        return <File className="h-4 w-4" />;
      case "image":
        return <Image className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
      case "audio":
        return "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800";
      case "link":
        return "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800";
      case "file":
        return "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
      case "image":
        return "text-pink-600 bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800";
      case "pdf":
        return "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <MainLayout title="Course Modules">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Loading course modules...
          </p>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout title="Course Not Found">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Course not found</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            The course you're looking for doesn't exist or you don't have
            permission to access it.
          </p>
          <Button onClick={() => setLocation("/tutor/courses")}>
            Back to Courses
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Use modules from separate query if available, otherwise fall back to course.modules
  const sortedModules =
    (modules || course.modules)?.sort((a, b) => a.orderIndex - b.orderIndex) ||
    [];

  return (
    <MainLayout title={`${course.title} - Modules`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(`/tutor/courses/${course.slug}`)}
              >
                ← Back to Course
              </Button>
              <Badge variant={course.isPublished ? "default" : "secondary"}>
                {course.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-200">
              {course.title}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Manage course modules and content
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Module
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Module</DialogTitle>
              </DialogHeader>
              <ModuleForm
                moduleForm={moduleForm}
                setModuleForm={setModuleForm}
                onSubmit={handleCreateModule}
                onCancel={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                isLoading={createModuleMutation.isPending || uploadingFile}
                onFileChange={handleFileChange}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Total Modules
                  </p>
                  <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                    {sortedModules.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Published
                  </p>
                  <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                    {sortedModules.filter((m) => m.isPublished).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Drafts
                  </p>
                  <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                    {sortedModules.filter((m) => !m.isPublished).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Total Duration
                  </p>
                  <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                    {formatDuration(
                      sortedModules.reduce(
                        (acc, m) => acc + (m.duration || 0),
                        0,
                      ),
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          {sortedModules.length > 0 ? (
            sortedModules.map((module, index) => (
              <Card key={module.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center">
                    {/* Drag Handle */}
                    <div className="p-4 border-r border-neutral-200 dark:border-neutral-700">
                      <Move className="h-4 w-4 text-neutral-400 cursor-grab" />
                    </div>
                    {/* Module Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getTypeColor(module.type)}`}
                            >
                              {getTypeIcon(module.type)}
                              <span className="capitalize">{module.type}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                              {module.title}
                            </h3>
                            <Badge
                              variant={
                                module.isPublished ? "default" : "secondary"
                              }
                            >
                              {module.isPublished ? "Published" : "Draft"}
                            </Badge>
                            {module.duration && (
                              <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                                {formatDuration(module.duration)}
                              </span>
                            )}
                          </div>
                          {module.description && (
                            <p className="text-neutral-600 dark:text-neutral-400 mb-3">
                              {module.description}
                            </p>
                          )}
                          {/* Content Preview */}
                          <div className="space-y-2">
                            {module.type === "link" && module.content && (
                              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <ExternalLink className="h-4 w-4 text-blue-600" />
                                <a
                                  href={module.content}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm truncate"
                                >
                                  {module.content}
                                </a>
                              </div>
                            )}
                            {module.type === "text" && module.content && (
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                                  {module.content}
                                </p>
                              </div>
                            )}
                            {(module.type === "file" ||
                              module.type === "image" ||
                              module.type === "video" ||
                              module.type === "audio" ||
                              module.type === "pdf") &&
                              module.fileUrl && (
                                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                  <div
                                    className={`p-2 rounded ${getTypeColor(module.type)}`}
                                  >
                                    {getTypeIcon(module.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                                      {module.fileName}
                                    </p>
                                    {module.fileSize && (
                                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        {formatFileSize(module.fileSize)}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {module.type === "image" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          window.open(module.fileUrl, "_blank")
                                        }
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        Preview
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        window.open(module.fileUrl, "_blank")
                                      }
                                    >
                                      <Download className="h-3 w-3 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              )}
                            {module.content &&
                              (module.type === "file" ||
                                module.type === "image" ||
                                module.type === "video" ||
                                module.type === "audio" ||
                                module.type === "pdf") && (
                                <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {module.content}
                                  </p>
                                </div>
                              )}
                          </div>
                          {/* Timestamps */}
                          <div className="flex items-center gap-4 mt-4 text-xs text-neutral-500 dark:text-neutral-400">
                            <span>
                              Created:{" "}
                              {new Date(module.createdAt).toLocaleDateString()}
                            </span>
                            <span>
                              Updated:{" "}
                              {new Date(module.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleTogglePublish(module.id, module.isPublished)
                            }
                            disabled={togglePublishMutation.isPending}
                          >
                            {module.isPublished ? (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Publish
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditModule(module)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteModule(module.id)}
                            disabled={deleteModuleMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                  No modules yet
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  Start building your course by adding your first module.
                </p>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add First Module
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Module Dialog */}
        <Dialog
          open={!!editingModule}
          onOpenChange={() => setEditingModule(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Module</DialogTitle>
            </DialogHeader>
            <ModuleForm
              moduleForm={moduleForm}
              setModuleForm={setModuleForm}
              onSubmit={handleUpdateModule}
              onCancel={() => {
                setEditingModule(null);
                resetForm();
              }}
              isLoading={updateModuleMutation.isPending || uploadingFile}
              onFileChange={handleFileChange}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
