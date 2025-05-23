import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { apiRequest } from '@/lib/queryClient';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Database, 
  Bell, 
  Mail,
  RefreshCcw,
  PanelLeft,
  Info
} from 'lucide-react';

export default function AdminSettings() {
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [autoApproveStudents, setAutoApproveStudents] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [darkModeDefault, setDarkModeDefault] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');
  
  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiRequest('PUT', '/api/admin/settings', settings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Settings saved',
        description: 'Your settings have been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to save settings: ${error}`,
      });
    }
  });
  
  // Reset database mutation
  const resetDatabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/reset-database', {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Database reset',
        description: 'The database has been reset successfully.',
      });
      setConfirmDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to reset database: ${error}`,
      });
    }
  });
  
  // Backup database mutation
  const backupDatabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/backup-database', {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Database backed up',
        description: 'The database has been backed up successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to backup database: ${error}`,
      });
    }
  });
  
  // Save settings
  const saveSettings = () => {
    const settings = {
      notifications: {
        email: emailNotifications,
        security: securityAlerts
      },
      enrollment: {
        autoApprove: autoApproveStudents
      },
      system: {
        maintenanceMode,
        darkModeDefault,
        debugMode
      }
    };
    
    saveSettingsMutation.mutate(settings);
  };
  
  // Confirm dangerous action
  const confirmDangerousAction = (
    action: () => void, 
    title: string, 
    message: string
  ) => {
    setConfirmAction(() => action);
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmDialogOpen(true);
  };
  
  // Reset database with confirmation
  const handleResetDatabase = () => {
    confirmDangerousAction(
      () => resetDatabaseMutation.mutate(),
      'Reset Database',
      'This will delete all data including courses, users, enrollments, and submissions. This action cannot be undone. Are you sure you want to continue?'
    );
  };
  
  // Backup database
  const handleBackupDatabase = () => {
    backupDatabaseMutation.mutate();
  };
  
  // Toggle maintenance mode with confirmation
  const handleToggleMaintenance = () => {
    if (!maintenanceMode) {
      confirmDangerousAction(
        () => {
          setMaintenanceMode(true);
          saveSettings();
        },
        'Enable Maintenance Mode',
        'This will make the platform inaccessible to all users except administrators. Are you sure you want to continue?'
      );
    } else {
      setMaintenanceMode(false);
      saveSettings();
    }
  };
  
  return (
    <MainLayout title="System Settings">
      <div className="space-y-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-xl">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>System</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure basic platform settings and appearance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium">Dark Mode Default</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Set dark mode as the default theme for all users.
                    </p>
                  </div>
                  <Switch 
                    checked={darkModeDefault} 
                    onCheckedChange={setDarkModeDefault} 
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium">Auto-approve Student Enrollments</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Automatically approve student enrollment requests without tutor review.
                    </p>
                  </div>
                  <Switch 
                    checked={autoApproveStudents} 
                    onCheckedChange={setAutoApproveStudents} 
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium">Sidebar Navigation</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Show sidebar navigation by default on desktop.
                    </p>
                  </div>
                  <Switch 
                    checked={true} 
                    onCheckedChange={() => {}} 
                  />
                </div>
                
                <div className="pt-4 border-t">
                  <Button onClick={saveSettings}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security features and access control.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium">Security Alerts</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Send security alerts for suspicious login attempts.
                    </p>
                  </div>
                  <Switch 
                    checked={securityAlerts} 
                    onCheckedChange={setSecurityAlerts} 
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Require two-factor authentication for all users.
                    </p>
                  </div>
                  <Switch 
                    checked={true} 
                    onCheckedChange={() => {}} 
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium">Session Timeout</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Automatically log out inactive users after 30 minutes.
                    </p>
                  </div>
                  <Switch 
                    checked={true} 
                    onCheckedChange={() => {}} 
                  />
                </div>
                
                <div className="pt-4 border-t">
                  <Button onClick={saveSettings}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure email notifications and alerts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium">Email Notifications</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Send email notifications for important events.
                    </p>
                  </div>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications} 
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium">Assignment Reminders</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Send reminder emails for upcoming assignment deadlines.
                    </p>
                  </div>
                  <Switch 
                    checked={true} 
                    onCheckedChange={() => {}} 
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium">Email Templates</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Customize email templates for system notifications.
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-1" />
                    Edit Templates
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <Button onClick={saveSettings}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Maintenance</CardTitle>
                <CardDescription>
                  Perform system maintenance tasks and database operations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium">Maintenance Mode</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Enable maintenance mode to temporarily disable access to the platform.
                    </p>
                  </div>
                  <Button 
                    variant={maintenanceMode ? "destructive" : "outline"}
                    onClick={handleToggleMaintenance}
                  >
                    {maintenanceMode ? "Disable Maintenance" : "Enable Maintenance"}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium">Debug Mode</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Enable detailed error messages and debug information.
                    </p>
                  </div>
                  <Switch 
                    checked={debugMode} 
                    onCheckedChange={setDebugMode} 
                  />
                </div>
                
                <div className="pt-4 mt-4 border-t space-y-4">
                  <h3 className="text-base font-medium">Database Operations</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-medium">Backup Database</h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Create a backup of the current database.
                        </p>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={handleBackupDatabase}
                      >
                        <Database className="h-4 w-4 mr-1" />
                        Backup Now
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-medium">Reset Database</h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Clear all data and reset the database to initial state.
                        </p>
                      </div>
                      <Button 
                        variant="destructive"
                        onClick={handleResetDatabase}
                      >
                        <RefreshCcw className="h-4 w-4 mr-1" />
                        Reset Database
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 mt-4 border-t">
                  <div className="p-4 bg-blue-50 text-blue-800 rounded-md flex dark:bg-blue-900 dark:text-blue-200">
                    <div className="mr-3 flex-shrink-0">
                      <Info className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">System Information</h4>
                      <p className="text-xs mt-1">
                        Version: 1.0.0<br />
                        Last Update: May 23, 2025<br />
                        Server Status: Operational
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button onClick={saveSettings}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmAction()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}