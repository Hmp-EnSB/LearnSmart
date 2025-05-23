import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, CheckCircle2, Clock, Calendar } from 'lucide-react';

interface Module {
  id: number;
  title: string;
  content: string;
  order: number;
  assignments: Assignment[];
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  submitted?: boolean;
  submissionId?: number;
  graded?: boolean;
  score?: number;
}

export default function StudentCourseDetail() {
  const { slug } = useParams();
  const [modules, setModules] = useState<Module[]>([]);
  const [courseProgress, setCourseProgress] = useState(0);
  const [enrollment, setEnrollment] = useState<any>(null);
  
  // Fetch course details
  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: [`/api/courses/${slug}`],
  });
  
  // Fetch student analytics
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['/api/analytics/student'],
  });
  
  // Fetch enrollments
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['/api/enrollments?student=me'],
  });
  
  // Process course modules and assignments
  useEffect(() => {
    if (course && course.modules) {
      const fetchAssignmentsForModules = async () => {
        const modulesWithAssignments = await Promise.all(
          course.modules.map(async (module: any) => {
            // Fetch assignments for this module
            const response = await fetch(`/api/assignments?moduleId=${module.id}`, {
              credentials: 'include'
            });
            let assignments = [];
            
            if (response.ok) {
              assignments = await response.json();
              
              // Check if student has submitted each assignment
              await Promise.all(
                assignments.map(async (assignment: any) => {
                  const submissionResponse = await fetch(`/api/submissions?assignmentId=${assignment.id}&student=me`, {
                    credentials: 'include'
                  });
                  
                  if (submissionResponse.ok) {
                    const submission = await submissionResponse.json();
                    if (submission) {
                      assignment.submitted = true;
                      assignment.submissionId = submission.id;
                      assignment.graded = submission.graded;
                      assignment.score = submission.score;
                    } else {
                      assignment.submitted = false;
                    }
                  }
                })
              );
            }
            
            return {
              ...module,
              assignments
            };
          })
        );
        
        setModules(modulesWithAssignments);
      };
      
      fetchAssignmentsForModules();
    }
  }, [course]);
  
  // Calculate course progress
  useEffect(() => {
    if (analytics && course) {
      setCourseProgress(analytics.courseProgress[course.id] || 0);
    }
  }, [analytics, course]);
  
  // Find enrollment status
  useEffect(() => {
    if (enrollments && course) {
      const enrollment = enrollments.find((e: any) => e.course.id === course.id);
      setEnrollment(enrollment);
    }
  }, [enrollments, course]);
  
  const isLoading = loadingCourse || loadingAnalytics || loadingEnrollments;
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading course...</p>
        </div>
      </MainLayout>
    );
  }
  
  if (!course) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-xl font-medium mb-2">Course Not Found</h2>
          <p className="text-neutral-600 mb-4 dark:text-neutral-400">The course you're looking for doesn't exist or is no longer available.</p>
          <Link href="/student/courses">
            <Button className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Courses
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }
  
  if (!enrollment || enrollment.status !== 'active') {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-xl font-medium mb-2">Not Enrolled</h2>
          <p className="text-neutral-600 mb-4 dark:text-neutral-400">
            {!enrollment ? 
              "You're not enrolled in this course." : 
              `Your enrollment status is: ${enrollment.status}.`}
          </p>
          <Link href="/student/courses">
            <Button className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Courses
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/student/courses">
            <a className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300">
              <ArrowLeft className="h-5 w-5" />
            </a>
          </Link>
          <h1 className="text-2xl font-heading font-semibold text-neutral-800 dark:text-neutral-200">{course.title}</h1>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Course Content</CardTitle>
                  <Badge variant="active">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <ProgressBar value={courseProgress} size="md" label="Course Progress" showPercentage />
                </div>
                
                {modules.length === 0 ? (
                  <p className="text-neutral-600 dark:text-neutral-400">No modules available yet.</p>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {modules.map((module, index) => (
                      <AccordionItem key={module.id} value={`module-${module.id}`}>
                        <AccordionTrigger className="py-4 px-1">
                          <div className="flex items-center">
                            <span className="mr-2">{index + 1}.</span>
                            <span>{module.title}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="py-2 px-1 space-y-4">
                            <div className="prose dark:prose-invert max-w-none">
                              <p>{module.content}</p>
                            </div>
                            
                            {module.assignments.length > 0 && (
                              <div className="mt-4 space-y-3">
                                <h4 className="font-medium text-neutral-800 dark:text-neutral-200">Assignments</h4>
                                {module.assignments.map(assignment => (
                                  <Card key={assignment.id}>
                                    <CardContent className="p-4">
                                      <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-3">
                                          <div className="p-2 rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800">
                                            <FileText className="h-5 w-5" />
                                          </div>
                                          <div>
                                            <h5 className="font-medium text-neutral-800 dark:text-neutral-200">{assignment.title}</h5>
                                            <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 space-x-4 mt-1">
                                              <span className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-1" />
                                                {new Date(assignment.dueDate).toLocaleDateString()}
                                              </span>
                                              <span className="flex items-center">
                                                <Clock className="h-4 w-4 mr-1" />
                                                {new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div>
                                          {assignment.submitted ? (
                                            <>
                                              <Badge variant={assignment.graded ? 'completed' : 'active'} className="mb-2">
                                                {assignment.graded ? 'Graded' : 'Submitted'}
                                              </Badge>
                                              {assignment.graded && (
                                                <div className="text-sm text-right">
                                                  <span className="text-neutral-600 dark:text-neutral-400">Score: </span>
                                                  <span className="font-medium">{assignment.score}/{assignment.maxScore}</span>
                                                </div>
                                              )}
                                            </>
                                          ) : (
                                            <Link href={`/student/assignments/${assignment.id}`}>
                                              <Button size="sm">Start</Button>
                                            </Link>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="w-full lg:w-1/3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About This Course</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700 mb-4 dark:text-neutral-300">{course.description}</p>
                
                <div className="border-t border-neutral-200 pt-4 mt-4 dark:border-neutral-700">
                  <h4 className="font-medium text-neutral-800 mb-2 dark:text-neutral-200">Instructor</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <span>{course.tutor?.fullName?.charAt(0) || 'T'}</span>
                    </div>
                    <div>
                      <p className="font-medium">{course.tutor?.fullName || 'Unknown Tutor'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-neutral-200 pt-4 mt-4 dark:border-neutral-700">
                  <h4 className="font-medium text-neutral-800 mb-2 dark:text-neutral-200">Course Stats</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Modules</p>
                      <p className="font-medium">{modules.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Assignments</p>
                      <p className="font-medium">
                        {modules.reduce((total, module) => total + module.assignments.length, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Completed</p>
                      <p className="font-medium">
                        {modules.reduce((total, module) => 
                          total + module.assignments.filter(a => a.submitted && a.graded).length, 0
                        )} / {modules.reduce((total, module) => total + module.assignments.length, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Progress</p>
                      <p className="font-medium">{courseProgress}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
