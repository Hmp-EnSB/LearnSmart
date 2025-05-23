import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertCircle, Check, FileText, ArrowRight } from 'lucide-react';

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  moduleId: number;
  maxScore: number;
  course?: {
    id: number;
    title: string;
    slug: string;
  };
  module?: {
    title: string;
  };
  submission?: {
    id: number;
    content: string;
    submittedAt: string;
    graded: boolean;
    score: number | null;
    feedback: string;
  };
  status?: 'pending' | 'urgent' | 'completed' | 'graded';
}

export default function StudentAssignments() {
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<Assignment[]>([]);
  
  // Fetch enrollments to get active courses
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['/api/enrollments?student=me'],
  });
  
  useEffect(() => {
    if (enrollments) {
      const activeCourses = enrollments
        .filter((e: any) => e.status === 'active')
        .map((e: any) => e.course);
      
      const fetchAssignmentsForCourses = async () => {
        const allAssignments: Assignment[] = [];
        
        await Promise.all(
          activeCourses.map(async (course: any) => {
            try {
              // Fetch assignments for this course
              const assignmentsResponse = await fetch(`/api/assignments?courseId=${course.id}`, {
                credentials: 'include'
              });
              
              if (assignmentsResponse.ok) {
                const courseAssignments = await assignmentsResponse.json();
                
                // Fetch module details for each assignment
                await Promise.all(
                  courseAssignments.map(async (assignment: any) => {
                    // Add course info to assignment
                    assignment.course = {
                      id: course.id,
                      title: course.title,
                      slug: course.slug
                    };
                    
                    // Fetch module info
                    const moduleResponse = await fetch(`/api/modules?courseId=${course.id}`, {
                      credentials: 'include'
                    });
                    
                    if (moduleResponse.ok) {
                      const modules = await moduleResponse.json();
                      const module = modules.find((m: any) => m.id === assignment.moduleId);
                      if (module) {
                        assignment.module = {
                          title: module.title
                        };
                      }
                    }
                    
                    // Check if student has submitted this assignment
                    const submissionResponse = await fetch(`/api/submissions?assignmentId=${assignment.id}&student=me`, {
                      credentials: 'include'
                    });
                    
                    if (submissionResponse.ok) {
                      const submission = await submissionResponse.json();
                      assignment.submission = submission;
                      
                      if (submission) {
                        assignment.status = submission.graded ? 'graded' : 'completed';
                      } else {
                        // Calculate if assignment is urgent
                        const dueDate = new Date(assignment.dueDate);
                        const today = new Date();
                        const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                        
                        assignment.status = diffDays <= 2 ? 'urgent' : 'pending';
                      }
                    }
                    
                    allAssignments.push(assignment);
                  })
                );
              }
            } catch (error) {
              console.error(`Error fetching assignments for course ${course.id}:`, error);
            }
          })
        );
        
        // Separate pending and completed assignments
        const pending: Assignment[] = [];
        const completed: Assignment[] = [];
        
        allAssignments.forEach(assignment => {
          if (assignment.status === 'pending' || assignment.status === 'urgent') {
            pending.push(assignment);
          } else {
            completed.push(assignment);
          }
        });
        
        // Sort pending by due date (ascending)
        pending.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        
        // Sort completed by submission date (descending)
        completed.sort((a, b) => 
          new Date(b.submission?.submittedAt || 0).getTime() - 
          new Date(a.submission?.submittedAt || 0).getTime()
        );
        
        setPendingAssignments(pending);
        setCompletedAssignments(completed);
      };
      
      fetchAssignmentsForCourses();
    }
  }, [enrollments]);
  
  const isLoading = loadingEnrollments;

  return (
    <MainLayout title="Assignments">
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Pending ({pendingAssignments.length})</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Completed ({completedAssignments.length})</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <p>Loading assignments...</p>
          ) : pendingAssignments.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-neutral-800 dark:text-neutral-200">All caught up!</h3>
              <p className="text-neutral-600 dark:text-neutral-400">You have no pending assignments.</p>
            </div>
          ) : (
            pendingAssignments.map(assignment => (
              <Card key={assignment.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                
                <div className="flex-grow">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="font-medium text-neutral-800 dark:text-neutral-200">{assignment.title}</h3>
                    {assignment.status === 'urgent' ? (
                      <Badge variant="urgent" className="flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span>Urgent</span>
                      </Badge>
                    ) : (
                      <Badge variant="pending">Pending</Badge>
                    )}
                  </div>
                  
                  <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {assignment.course?.title} • {assignment.module?.title}
                  </div>
                  
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0 self-end md:self-center mt-2 md:mt-0">
                  <Link href={`/student/assignments/${assignment.id}`}>
                    <Button className="flex items-center gap-2">
                      <span>Start</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {isLoading ? (
            <p>Loading assignments...</p>
          ) : completedAssignments.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 mb-4">
                <FileText className="h-6 w-6 text-neutral-600" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-neutral-800 dark:text-neutral-200">No submissions yet</h3>
              <p className="text-neutral-600 dark:text-neutral-400">Complete some assignments to see them here.</p>
            </div>
          ) : (
            completedAssignments.map(assignment => (
              <Card key={assignment.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                
                <div className="flex-grow">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="font-medium text-neutral-800 dark:text-neutral-200">{assignment.title}</h3>
                    {assignment.status === 'graded' ? (
                      <Badge variant="completed">Graded</Badge>
                    ) : (
                      <Badge variant="active">Submitted</Badge>
                    )}
                  </div>
                  
                  <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {assignment.course?.title} • {assignment.module?.title}
                  </div>
                  
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <div className="text-neutral-500 dark:text-neutral-400">
                      Submitted: {new Date(assignment.submission?.submittedAt || '').toLocaleString()}
                    </div>
                    
                    {assignment.status === 'graded' && (
                      <div className="text-neutral-800 dark:text-neutral-200 font-medium">
                        Score: {assignment.submission?.score || 0}/{assignment.maxScore}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-shrink-0 self-end md:self-center mt-2 md:mt-0">
                  <Link href={`/student/assignments/${assignment.id}`}>
                    <Button variant="outline" className="flex items-center gap-2">
                      <span>View</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
