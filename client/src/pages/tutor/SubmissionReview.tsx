import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  ArrowLeft, 
  Check, 
  AlertCircle,
  Users,
  Calendar,
  ClipboardCheck,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Define the schema for grading a submission
const gradingSchema = z.object({
  feedback: z.string().min(1, 'Feedback is required'),
  score: z.coerce.number().min(0).max(100)
});

type GradingFormValues = z.infer<typeof gradingSchema>;

interface Student {
  id: number;
  fullName: string;
  username: string;
  email: string;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  moduleId: number;
  module?: {
    title: string;
    courseId: number;
  };
  course?: {
    title: string;
  };
}

interface Submission {
  id: number;
  assignmentId: number;
  studentId: number;
  content: string;
  submittedAt: string;
  feedback: string | null;
  score: number | null;
  graded: boolean;
  student: Student;
}

export default function TutorSubmissionReview() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  
  // Set up grading form
  const form = useForm<GradingFormValues>({
    resolver: zodResolver(gradingSchema),
    defaultValues: {
      feedback: '',
      score: 0
    }
  });
  
  // Fetch assignment data
  const { data: assignmentData, isLoading: loadingAssignment } = useQuery({
    queryKey: [`/api/assignments/${id}`],
  });
  
  // Fetch submissions for this assignment
  const { data: submissionsData, isLoading: loadingSubmissions, refetch: refetchSubmissions } = useQuery({
    queryKey: [`/api/submissions?assignmentId=${id}`],
  });
  
  // Process assignment data
  useEffect(() => {
    if (assignmentData) {
      setAssignment(assignmentData);
    }
  }, [assignmentData]);
  
  // Process submissions data
  useEffect(() => {
    if (submissionsData) {
      setSubmissions(submissionsData);
    }
  }, [submissionsData]);
  
  // Grade submission mutation
  const gradeSubmissionMutation = useMutation({
    mutationFn: async ({ submissionId, data }: { submissionId: number, data: GradingFormValues }) => {
      const response = await apiRequest('PUT', `/api/submissions/${submissionId}`, {
        ...data,
        graded: true
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Submission graded',
        description: 'The submission has been graded successfully.',
      });
      refetchSubmissions();
      setSelectedSubmission(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to grade submission: ${error}`,
      });
    }
  });
  
  // Handle submission selection
  const selectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    
    // If already graded, populate form with existing values
    if (submission.graded) {
      form.reset({
        feedback: submission.feedback || '',
        score: submission.score || 0
      });
    } else {
      form.reset({
        feedback: '',
        score: 0
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = (values: GradingFormValues) => {
    if (!selectedSubmission) return;
    
    gradeSubmissionMutation.mutate({
      submissionId: selectedSubmission.id,
      data: values
    });
  };
  
  // Filter submissions by grading status
  const pendingSubmissions = submissions.filter(s => !s.graded);
  const gradedSubmissions = submissions.filter(s => s.graded);
  
  const isLoading = loadingAssignment || loadingSubmissions;
  
  return (
    <MainLayout title="Review Submissions">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/tutor/assignments')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          {assignment && (
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {assignment.course?.title} / {assignment.module?.title} / {assignment.title}
            </span>
          )}
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading assignment details...</p>
          </div>
        ) : (
          <>
            {assignment && (
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap justify-between items-start">
                    <div>
                      <CardTitle>{assignment.title}</CardTitle>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        Max Score: {assignment.maxScore} points
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{submissions.length} Submissions</span>
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <ClipboardCheck className="h-3 w-3" />
                        <span>{gradedSubmissions.length} Graded</span>
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{assignment.description}</p>
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span>Submissions</span>
                      <Badge variant="outline">{submissions.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 py-0">
                    {submissions.length === 0 ? (
                      <div className="text-center py-8">
                        <p>No submissions for this assignment yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="px-4 py-2 border-b">
                          <h3 className="text-sm font-medium flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-secondary-500" />
                            <span>Pending Review ({pendingSubmissions.length})</span>
                          </h3>
                        </div>
                        
                        {pendingSubmissions.map(submission => (
                          <div
                            key={submission.id}
                            className={`px-4 py-3 border-l-2 cursor-pointer transition-all ${
                              selectedSubmission?.id === submission.id
                                ? 'border-l-primary bg-neutral-50 dark:bg-neutral-800'
                                : 'border-l-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800'
                            }`}
                            onClick={() => selectSubmission(submission)}
                          >
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">{submission.student.fullName}</h4>
                              <Badge variant="pending" className="text-xs">Pending</Badge>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                        
                        <div className="px-4 py-2 border-b border-t">
                          <h3 className="text-sm font-medium flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span>Graded ({gradedSubmissions.length})</span>
                          </h3>
                        </div>
                        
                        {gradedSubmissions.map(submission => (
                          <div
                            key={submission.id}
                            className={`px-4 py-3 border-l-2 cursor-pointer transition-all ${
                              selectedSubmission?.id === submission.id
                                ? 'border-l-primary bg-neutral-50 dark:bg-neutral-800'
                                : 'border-l-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800'
                            }`}
                            onClick={() => selectSubmission(submission)}
                          >
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">{submission.student.fullName}</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="active" className="text-xs">{submission.score}/{assignment?.maxScore}</Badge>
                              </div>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-8">
                {selectedSubmission ? (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>
                          Submission by {selectedSubmission.student.fullName}
                        </CardTitle>
                        <Badge variant={selectedSubmission.graded ? 'active' : 'pending'}>
                          {selectedSubmission.graded ? 'Graded' : 'Pending Review'}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Submitted on {new Date(selectedSubmission.submittedAt).toLocaleString()}
                      </p>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Student's Response:</h3>
                          <div className="p-4 bg-neutral-50 rounded-lg border whitespace-pre-line dark:bg-neutral-800 dark:border-neutral-700">
                            {selectedSubmission.content}
                          </div>
                        </div>
                        
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="feedback"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Feedback</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      placeholder="Provide feedback to the student..."
                                      className="min-h-[100px] resize-y"
                                      disabled={selectedSubmission.graded}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="flex items-end gap-4">
                              <FormField
                                control={form.control}
                                name="score"
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormLabel>Score</FormLabel>
                                    <div className="flex items-center gap-2">
                                      <FormControl>
                                        <Input
                                          {...field}
                                          type="number"
                                          min={0}
                                          max={assignment?.maxScore ?? 100}
                                          disabled={selectedSubmission.graded}
                                        />
                                      </FormControl>
                                      <span className="text-neutral-500 dark:text-neutral-400">
                                        / {assignment?.maxScore}
                                      </span>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              {!selectedSubmission.graded && (
                                <Button 
                                  type="submit"
                                  className="flex-1 max-w-[200px]"
                                >
                                  Submit Grade
                                </Button>
                              )}
                            </div>
                          </form>
                        </Form>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4 dark:bg-neutral-800">
                        <ClipboardCheck className="h-8 w-8 text-neutral-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Select a Submission</h3>
                      <p className="text-neutral-500 dark:text-neutral-400 max-w-md">
                        Select a submission from the list on the left to view and grade it.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}