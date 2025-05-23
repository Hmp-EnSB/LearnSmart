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
  Award, 
  Plus, 
  Edit, 
  Trash, 
  Users,
  Image
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface AppBadge {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  criteria: string;
  awardCount?: number;
}

// Schema for badge creation and editing
const badgeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  imageUrl: z.string().min(1, 'Image URL is required'),
  criteria: z.string().min(1, 'Criteria is required'),
});

type BadgeFormValues = z.infer<typeof badgeSchema>;

export default function AdminBadgeManagement() {
  const { toast } = useToast();
  const [badges, setBadges] = useState<AppBadge[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<AppBadge | null>(null);
  const [badgeToDelete, setBadgeToDelete] = useState<AppBadge | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Set up badge form for create/edit
  const form = useForm<BadgeFormValues>({
    resolver: zodResolver(badgeSchema),
    defaultValues: {
      name: '',
      description: '',
      imageUrl: '',
      criteria: '',
    }
  });
  
  // Fetch badges
  const { data: badgesData, isLoading, refetch: refetchBadges } = useQuery({
    queryKey: ['/api/badges'],
  });
  
  // Process badges data
  useEffect(() => {
    if (badgesData) {
      // Fetch additional stats for each badge
      const enhancedBadges = Promise.all(
        badgesData.map(async (badge: AppBadge) => {
          try {
            // Fetch badge awards count
            const userBadgesResponse = await fetch(`/api/users/all/badges?badgeId=${badge.id}`, {
              credentials: 'include'
            });
            
            if (userBadgesResponse.ok) {
              const userBadges = await userBadgesResponse.json();
              badge.awardCount = userBadges.length;
            } else {
              badge.awardCount = 0;
            }
            
            return badge;
          } catch (error) {
            console.error(`Error fetching awards for badge ${badge.id}:`, error);
            badge.awardCount = 0;
            return badge;
          }
        })
      );
      
      enhancedBadges.then(data => {
        setBadges(data);
      });
    }
  }, [badgesData]);
  
  // Create badge mutation
  const createBadgeMutation = useMutation({
    mutationFn: async (data: BadgeFormValues) => {
      const response = await apiRequest('POST', '/api/badges', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Badge created',
        description: 'The badge has been created successfully.',
      });
      refetchBadges();
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to create badge: ${error}`,
      });
    }
  });
  
  // Update badge mutation
  const updateBadgeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: BadgeFormValues }) => {
      const response = await apiRequest('PUT', `/api/badges/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Badge updated',
        description: 'The badge has been updated successfully.',
      });
      refetchBadges();
      setIsEditDialogOpen(false);
      setSelectedBadge(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update badge: ${error}`,
      });
    }
  });
  
  // Delete badge mutation
  const deleteBadgeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/badges/${id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: 'Badge deleted',
        description: 'The badge has been deleted successfully.',
      });
      refetchBadges();
      setDeleteDialogOpen(false);
      setBadgeToDelete(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete badge: ${error}`,
      });
    }
  });
  
  // Handle create badge click
  const handleCreateBadge = () => {
    form.reset({
      name: '',
      description: '',
      imageUrl: '',
      criteria: '',
    });
    setIsCreateDialogOpen(true);
  };
  
  // Handle edit badge click
  const handleEditBadge = (badge: AppBadge) => {
    setSelectedBadge(badge);
    
    form.reset({
      name: badge.name,
      description: badge.description,
      imageUrl: badge.imageUrl,
      criteria: badge.criteria,
    });
    
    setIsEditDialogOpen(true);
  };
  
  // Handle delete confirmation
  const confirmDeleteBadge = (badge: AppBadge) => {
    setBadgeToDelete(badge);
    setDeleteDialogOpen(true);
  };
  
  // Handle delete execution
  const handleDeleteBadge = () => {
    if (badgeToDelete) {
      deleteBadgeMutation.mutate(badgeToDelete.id);
    }
  };
  
  // Handle create form submission
  const handleCreateSubmit = (values: BadgeFormValues) => {
    createBadgeMutation.mutate(values);
  };
  
  // Handle edit form submission
  const handleEditSubmit = (values: BadgeFormValues) => {
    if (!selectedBadge) return;
    
    updateBadgeMutation.mutate({
      id: selectedBadge.id,
      data: values
    });
  };
  
  return (
    <MainLayout title="Badge Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-neutral-500 dark:text-neutral-400">
              Create and manage achievement badges to reward student progress and engagement.
            </p>
          </div>
          <Button 
            className="flex items-center gap-2"
            onClick={handleCreateBadge}
          >
            <Plus className="h-4 w-4" />
            <span>Create Badge</span>
          </Button>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">Badges</CardTitle>
            <Badge variant="outline" className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              <span>Total: {badges.length}</span>
            </Badge>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p>Loading badges...</p>
              </div>
            ) : badges.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                  <Award className="h-6 w-6 text-neutral-500" />
                </div>
                <h3 className="text-lg font-medium mb-1">No badges found</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  Create your first badge to reward student achievements.
                </p>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={handleCreateBadge}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Badge</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map(badge => (
                  <div 
                    key={badge.id} 
                    className="border rounded-lg overflow-hidden bg-white dark:bg-neutral-800"
                  >
                    <div className="h-40 bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center overflow-hidden">
                      {badge.imageUrl ? (
                        <img 
                          src={badge.imageUrl} 
                          alt={badge.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-neutral-400">
                          <Image className="h-12 w-12 mb-2" />
                          <span className="text-sm">No image available</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-lg">{badge.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {badge.awardCount} awarded
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {badge.description}
                      </p>
                      <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                        <h4 className="text-xs font-medium text-neutral-500 uppercase mb-1">Criteria</h4>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          {badge.criteria}
                        </p>
                      </div>
                      <div className="mt-4 flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditBadge(badge)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => confirmDeleteBadge(badge)}
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Create Badge Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Badge</DialogTitle>
            <DialogDescription>
              Create a new achievement badge to reward students.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Badge Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Perfect Score" />
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
                        placeholder="Brief description of the badge" 
                        className="h-20 resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://example.com/badge-image.png" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="criteria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Award Criteria</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Specific requirements to earn this badge" 
                        className="h-20 resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Badge</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Badge Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Badge</DialogTitle>
            <DialogDescription>
              Update badge details and criteria.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Badge Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                        className="h-20 resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="criteria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Award Criteria</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="h-20 resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the badge "{badgeToDelete?.name}"? 
              This action cannot be undone and will remove all awarded instances of this badge from student profiles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBadge}
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