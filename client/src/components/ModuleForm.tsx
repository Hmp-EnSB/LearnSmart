import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Video,
  Image,
  Music,
  Link,
  FileIcon,
  Upload,
  X,
} from "lucide-react";

export interface ModuleFormData {
  title: string;
  description: string;
  type: "text" | "video" | "audio" | "link" | "file" | "image" | "pdf";
  content: string;
  duration?: number;
  isPublished?: boolean;
  file?: File | null;
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
}

interface ModuleFormProps {
  moduleForm: ModuleFormData;
  setModuleForm: React.Dispatch<React.SetStateAction<ModuleFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
  onFileChange: (file: File | null) => void;
  isEditing?: boolean;
}

const ModuleForm: React.FC<ModuleFormProps> = ({
  moduleForm,
  setModuleForm,
  onSubmit,
  onCancel,
  isLoading,
  onFileChange,
  isEditing = false,
}) => {
  const moduleTypes = [
    { value: "text", label: "Text Content", icon: FileText },
    { value: "video", label: "Video", icon: Video },
    { value: "audio", label: "Audio", icon: Music },
    { value: "image", label: "Image", icon: Image },
    { value: "pdf", label: "PDF Document", icon: FileIcon },
    { value: "file", label: "File", icon: FileIcon },
    { value: "link", label: "External Link", icon: Link },
  ];

  const selectedType = moduleTypes.find(
    (type) => type.value === moduleForm.type,
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileChange(file);
      setModuleForm((prev) => ({
        ...prev,
        file,
        fileName: file.name,
        fileSize: file.size,
      }));
    }
  };

  const removeFile = () => {
    onFileChange(null);
    setModuleForm((prev) => ({
      ...prev,
      file: undefined,
      fileName: undefined,
      fileSize: undefined,
      fileUrl: undefined,
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const requiresFile = ["video", "audio", "image", "pdf", "file"].includes(
    moduleForm.type,
  );
  const requiresLink = moduleForm.type === "link";
  const requiresTextContent = moduleForm.type === "text";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Module Title *</Label>
          <Input
            id="title"
            value={moduleForm.title}
            onChange={(e) =>
              setModuleForm((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Enter module title"
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={moduleForm.description}
            onChange={(e) =>
              setModuleForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Enter module description"
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="type">Module Type *</Label>
          <Select
            value={moduleForm.type}
            onValueChange={(value: ModuleFormData["type"]) =>
              setModuleForm((prev) => ({
                ...prev,
                type: value,
                content: "",
                file: undefined,
                fileName: undefined,
                fileSize: undefined,
                fileUrl: undefined,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select module type" />
            </SelectTrigger>
            <SelectContent>
              {moduleTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="0"
              value={moduleForm.duration || ""}
              onChange={(e) =>
                setModuleForm((prev) => ({
                  ...prev,
                  duration: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="0"
            />
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id="published"
              checked={moduleForm.isPublished || false}
              onCheckedChange={(checked) =>
                setModuleForm((prev) => ({ ...prev, isPublished: checked }))
              }
            />
            <Label htmlFor="published">Publish immediately</Label>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            {selectedType && <selectedType.icon className="h-5 w-5" />}
            <h3 className="text-lg font-semibold">
              {selectedType?.label} Content
            </h3>
          </div>

          {/* Text Content */}
          {requiresTextContent && (
            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={moduleForm.content}
                onChange={(e) =>
                  setModuleForm((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                placeholder="Enter your text content here..."
                rows={8}
                required
              />
            </div>
          )}

          {/* Link Content */}
          {requiresLink && (
            <div>
              <Label htmlFor="content">URL *</Label>
              <Input
                id="content"
                type="url"
                value={moduleForm.content}
                onChange={(e) =>
                  setModuleForm((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                placeholder="https://example.com"
                required
              />
            </div>
          )}

          {/* File Upload */}
          {requiresFile && (
            <div className="space-y-4">
              {/* File Upload Area */}
              <div>
                <Label>File Upload *</Label>
                <div className="mt-2">
                  {!moduleForm.file && !moduleForm.fileUrl ? (
                    <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                        accept={
                          moduleForm.type === "image"
                            ? "image/*"
                            : moduleForm.type === "video"
                              ? "video/*"
                              : moduleForm.type === "audio"
                                ? "audio/*"
                                : moduleForm.type === "pdf"
                                  ? ".pdf"
                                  : "*/*"
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document.getElementById("file-upload")?.click()
                        }
                      >
                        Choose File
                      </Button>
                    </div>
                  ) : (
                    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded">
                            {selectedType && (
                              <selectedType.icon className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{moduleForm.fileName}</p>
                            {moduleForm.fileSize && (
                              <p className="text-sm text-neutral-500">
                                {formatFileSize(moduleForm.fileSize)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Content for Files */}
              <div>
                <Label htmlFor="file-content">Additional Notes</Label>
                <Textarea
                  id="file-content"
                  value={moduleForm.content}
                  onChange={(e) =>
                    setModuleForm((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  placeholder="Add any additional notes or description for this file..."
                  rows={4}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{isEditing ? "Update Module" : "Create Module"}</>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ModuleForm;
