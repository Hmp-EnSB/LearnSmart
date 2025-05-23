import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submissionSchema } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ArrowLeft, Calendar, Clock, FileText, CheckCircle } from 'lucide-react';
import { z } from 'zod';

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  moduleId: number;
  maxScore: number;
  module?: {
    title: string;
    courseId: number;
    course?: {
      title: string;
      slug: string;
    }
  };
}

interface Submission {
  id: number;
  assignmentId: number;
  studentId: number;
  content: string;
  submittedAt: string;
  feedback: string;
  score: number | null;
  graded: boolean;
}

type SubmissionFormValues = z.infer<typeof submissionSchema>;

export default function AssignmentSubmit() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch assignment details
  const { data: assignmentData, isLoading: loadingAssignment } = useQuery({
    queryKey: [`/api/assignments/${id}`],
  });
  
  // Fetch submission if it exists
  const { data: submissionData, isLoading: loadingSubmission } = useQuery({
    queryKey: [`/api/submissions?assignmentId=${id}&student=me`],
  });
  
  // Setup form
  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      content: ''
    }
  });
  
  // Fetch module and course info
  useEffect(() => {
    if (assignmentData) {
      const fetchModuleAndCourse = async () => {
        const moduleResponse = await fetch(`/api/modules?courseId=${assignmentData.moduleId}`, {
          credentials: 'include'
        });
        
        if (moduleResponse.ok) {
          const modules = await moduleResponse.json();
          const module = modules.find((m: any) => m.id === assignmentData.moduleId);
          
          if (module) {
            const courseResponse = await fetch(`/api/courses/${module.courseId}`, {
              credentials: 'include'
            });
            
            if (courseResponse.ok) {
              const course = await courseResponse.json();
              
              setAssignment({
                ...assignmentData,
                module: {
                  ...module,
                  courseId: module.courseId,
                  course: {
                    title: course.title,
                    slug: course.slug
                  }
                }
              });
            } else {
              setAssignment({
                ...assignmentData,
                module: {
                  ...module,
                  courseId: module.courseId
                }
              });
            }
          } else {
            setAssignment(assignmentData);
          }
        } else {
          setAssignment(assignmentData);
        }
      };
      
      fetchModuleAndCourse();
    }
  }, [assignmentData]);
  
  // Set existing submission if available
  useEffect(() => {
    if (submissionData) {
      setSubmission(submissionData);
      form.setValue('content', submissionData.content);
    }
  }, [submissionData, form]);
  
  const handleSubmit = async (values: SubmissionFormValues) => {
    if (!assignment) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/assignments/${assignment.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(values)
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubmission(data);
        
        toast({
          title: 'Submission successful',
          description: 'Your assignment has been submitted.',
          variant: 'default'
        });
      } else {
        const errorData = await response.json();
        
        toast({
          title: 'Submission failed',
          description: errorData.message || 'An error occurred during submission.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      
      toast({
        title: 'Submission failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isLoading = loadingAssignment || loadingSubmission;
  const isReadOnly = !!submission;
  const isPastDue = assignment && new Date(assignment.dueDate) < new Date();
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading assignment...</p>
        </div>
      </MainLayout>
    );
  }
  
  if (!assignment) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-xl font-medium mb-2">Assignment Not Found</h2>
          <p className="text-neutral-600 mb-4 dark:text-neutral-400">The assignment you're looking for doesn't exist or is no longer available.</p>
          <Link href="/student/assignments">
            <Button className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Assignments
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/student/assignments">
              <a className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300">
                <ArrowLeft className="h-5 w-5" />
              </a>
            </Link>
            <h1 className="text-2xl font-heading font-semibold text-neutral-800 dark:text-neutral-200">
              {assignment.title}
            </h1>
          </div>
          
          <div className="flex items-center">
            {submission ? (
              submission.graded ? (
                <Badge variant="completed" className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Graded
                </Badge>
              ) : (
                <Badge variant="active">Submitted</Badge>
              )
            ) : isPastDue ? (
              <Badge variant="urgent">Past Due</Badge>
            ) : (
              <Badge variant="pending">Pending</Badge>
            )}
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 space-x-4">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>Max Score: {assignment.maxScore}</span>
                </div>
                
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-neutral-700 dark:text-neutral-300">{assignment.description}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>
                  {isReadOnly ? 'Your Submission' : 'Submit Your Work'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isReadOnly ? (
                  <div className="space-y-4">
                    <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700">
                      <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{submission.content}</p>
                    </div>
                    
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      Submitted on {new Date(submission.submittedAt).toLocaleString()}
                    </div>
                    
                    {submission.graded && (
                      <div className="mt-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-neutral-800 dark:text-neutral-200">Feedback</h3>
                          <span className="text-lg font-semibold">
                            Score: {submission.score} / {assignment.maxScore}
                          </span>
                        </div>
                        
                        <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700">
                          {submission.feedback ? (
                            <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{submission.feedback}</p>
                          ) : (
                            <p className="text-neutral-500 dark:text-neutral-400">No feedback provided.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Submission Content</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Type your answer here..."
                                className="min-h-[200px] resize-y"
                                {...field}
                                disabled={isSubmitting || isPastDue}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isSubmitting || isPastDue}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                      </Button>
                      
                      {isPastDue && (
                        <p className="text-destructive text-sm text-center">
                          This assignment is past due and cannot be submitted.
                        </p>
                      )}
                    </form>
                  </Form>
                )}
              </CardContent>
              {isReadOnly && (
                <CardFooter className="flex justify-end border-t border-neutral-200 pt-4 dark:border-neutral-700">
                  <Button variant="outline" onClick={() => navigate('/student/assignments')}>
                    Back to Assignments
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
          
          <div className="w-full lg:w-1/3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent>
                {assignment.module?.course ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-neutral-800 dark:text-neutral-200">Course</h4>
                      <p className="text-neutral-700 dark:text-neutral-300">{assignment.module.course.title}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-neutral-800 dark:text-neutral-200">Module</h4>
                      <p className="text-neutral-700 dark:text-neutral-300">{assignment.module.title}</p>
                    </div>
                    
                    <Link href={`/student/courses/${assignment.module.course.slug}`}>
                      <Button variant="outline" className="w-full">
                        Go to Course
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-neutral-500 dark:text-neutral-400">Course information not available.</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Submission Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-0.5 text-neutral-500" />
                    <span className="text-neutral-700 dark:text-neutral-300">
                      Submit your work in the format specified in the assignment details.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5 text-neutral-500" />
                    <span className="text-neutral-700 dark:text-neutral-300">
                      Submissions after the due date may not be accepted.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-neutral-500" />
                    <span className="text-neutral-700 dark:text-neutral-300">
                      Double-check your work before submitting. You cannot edit after submission.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
