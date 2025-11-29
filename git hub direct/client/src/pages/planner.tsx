import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Calendar,
  Clock,
  Sparkles,
  Loader2,
  Plus,
  Target,
  CheckCircle2,
} from "lucide-react";
import type { StudyPlan, StudyTask, Subject } from "@shared/schema";

const examplePrompts = [
  "Make me a 1-week plan for Digital Electronics",
  "Create a study schedule for my exams in 10 days",
  "Help me prepare for Physics in 5 days",
  "Plan my revision for Math and Chemistry",
];

function TaskCard({ 
  task, 
  onToggle 
}: { 
  task: StudyTask; 
  onToggle: (id: string, completed: boolean) => void;
}) {
  const priorityColors = {
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    low: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  };

  return (
    <div 
      className={`flex items-start gap-3 p-4 rounded-lg border ${
        task.completed ? "bg-muted/30 opacity-60" : ""
      }`}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={(checked) => onToggle(task.id, !!checked)}
        className="mt-0.5"
        data-testid={`checkbox-task-${task.id}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge variant="secondary" className="text-xs">
            {task.subject}
          </Badge>
          <Badge className={`text-xs ${priorityColors[task.priority]}`}>
            {task.priority}
          </Badge>
        </div>
        <p className={`font-medium ${task.completed ? "line-through" : ""}`}>
          {task.topic}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(task.date).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {task.duration}
          </span>
          {task.timeSlot && (
            <span>{task.timeSlot}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlannerPage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");

  const { data: studyPlans, isLoading } = useQuery<StudyPlan[]>({
    queryKey: ["/api/study-plans"],
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { prompt: string; subjects?: string[] }) => {
      const response = await apiRequest("POST", "/api/ai/study-plan", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setPrompt("");
      toast({
        title: "Study plan created!",
        description: "Your personalized study plan is ready.",
      });
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Could not generate study plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ planId, taskId, completed }: { planId: string; taskId: string; completed: boolean }) => {
      const response = await apiRequest("PATCH", `/api/study-plans/${planId}/tasks/${taskId}`, { completed });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Enter a prompt",
        description: "Please describe what you want to study.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      prompt,
      subjects: subjects?.map((s) => s.name),
    });
  };

  const activePlan = studyPlans?.[0];
  const completedTasks = activePlan?.tasks.filter((t) => t.completed).length || 0;
  const totalTasks = activePlan?.tasks.length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Group tasks by date
  const tasksByDate = activePlan?.tasks.reduce((acc, task) => {
    const date = task.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, StudyTask[]>) || {};

  const sortedDates = Object.keys(tasksByDate).sort();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Study Planner</h1>
        <p className="text-muted-foreground mt-1">
          Get AI-powered personalized study schedules
        </p>
      </div>

      {/* Generator Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Study Plan
          </CardTitle>
          <CardDescription>
            Tell me what you want to study and I'll create a personalized schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., 'Make me a 1-week plan for Physics and Chemistry exams'"
            className="min-h-[100px]"
            data-testid="textarea-planner-prompt"
          />
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setPrompt(example)}
                className="text-xs"
              >
                {example}
              </Button>
            ))}
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || generateMutation.isPending}
            className="w-full"
            data-testid="button-generate-plan"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating your plan...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Study Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active Study Plan */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : activePlan ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg">{activePlan.title}</CardTitle>
                <CardDescription className="mt-1">
                  {activePlan.description}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(progress)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {completedTasks} of {totalTasks} tasks
                </p>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mt-4">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {sortedDates.map((date) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">
                        {new Date(date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </h3>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {tasksByDate[date].filter((t) => t.completed).length} / {tasksByDate[date].length}
                      </Badge>
                    </div>
                    <div className="space-y-2 pl-6">
                      {tasksByDate[date].map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onToggle={(taskId, completed) =>
                            updateTaskMutation.mutate({
                              planId: activePlan.id,
                              taskId,
                              completed,
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No study plan yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Create a personalized study plan to organize your learning and track progress.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Study Planning Tips
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 flex-shrink-0" />
              Be specific about subjects, topics, and time frames
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 flex-shrink-0" />
              Include your exam dates for better prioritization
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 flex-shrink-0" />
              Mark tasks as complete to track your progress
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 flex-shrink-0" />
              Generate a new plan anytime to adjust your schedule
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
