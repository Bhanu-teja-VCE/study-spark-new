import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  FileText,
  Brain,
  HelpCircle,
  Flame,
  Upload,
  MessageCircle,
  Calendar,
  ArrowRight,
  Clock,
  FolderOpen,
  Sparkles,
  Plus,
} from "lucide-react";
import type { DashboardStats, Subject, Summary, StudyTask } from "@shared/schema";

const quickActions = [
  {
    title: "Upload Notes",
    description: "Add new study material",
    icon: Upload,
    href: "/upload",
    color: "bg-chart-1/10 text-chart-1",
  },
  {
    title: "AI Chat",
    description: "Ask any question",
    icon: MessageCircle,
    href: "/chat",
    color: "bg-chart-2/10 text-chart-2",
  },
  {
    title: "Flashcards",
    description: "Review your cards",
    icon: Brain,
    href: "/flashcards",
    color: "bg-chart-3/10 text-chart-3",
  },
  {
    title: "Study Plan",
    description: "Plan your schedule",
    icon: Calendar,
    href: "/planner",
    color: "bg-chart-4/10 text-chart-4",
  },
];

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentSummaryCard({ summary }: { summary: Summary }) {
  return (
    <Link href={`/summaries/${summary.id}`}>
      <div className="flex items-start gap-3 p-3 rounded-lg hover-elevate cursor-pointer">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{summary.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {summary.keyPoints.length} key points
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </Link>
  );
}

function TaskCard({ task }: { task: StudyTask }) {
  const priorityColors = {
    high: "bg-destructive/10 text-destructive",
    medium: "bg-chart-4/10 text-chart-4",
    low: "bg-chart-2/10 text-chart-2",
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover-elevate">
      <div className={`w-2 h-2 rounded-full mt-2 ${task.priority === 'high' ? 'bg-destructive' : task.priority === 'medium' ? 'bg-chart-4' : 'bg-chart-2'}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{task.topic}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {task.subject}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {task.duration}
          </span>
        </div>
      </div>
    </div>
  );
}

function SubjectCard({ subject }: { subject: Subject }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-chart-1/10 text-chart-1",
    green: "bg-chart-2/10 text-chart-2",
    purple: "bg-chart-3/10 text-chart-3",
    orange: "bg-chart-4/10 text-chart-4",
    pink: "bg-chart-5/10 text-chart-5",
  };

  return (
    <Link href={`/subjects/${subject.id}`}>
      <Card className="hover-elevate cursor-pointer h-full">
        <CardContent className="p-4">
          <div className={`w-10 h-10 rounded-lg ${colorClasses[subject.color] || colorClasses.blue} flex items-center justify-center mb-3`}>
            <BookOpen className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-sm">{subject.name}</h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{subject.notesCount} notes</span>
            <span>{subject.flashcardsCount} cards</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: subjects, isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your studies today.
          </p>
        </div>
        <Link href="/upload">
          <Button data-testid="button-upload-notes">
            <Upload className="h-4 w-4 mr-2" />
            Upload Notes
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title="Subjects"
              value={stats?.totalSubjects || 0}
              icon={FolderOpen}
            />
            <StatCard
              title="Notes"
              value={stats?.totalNotes || 0}
              icon={FileText}
            />
            <StatCard
              title="Flashcards"
              value={stats?.totalFlashcards || 0}
              icon={Brain}
            />
            <StatCard
              title="Questions"
              value={stats?.totalQuestions || 0}
              icon={HelpCircle}
            />
            <StatCard
              title="Study Streak"
              value={`${stats?.studyStreak || 0} days`}
              icon={Flame}
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Card className="hover-elevate cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-sm">{action.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Summaries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
            <div>
              <CardTitle className="text-lg">Recent Summaries</CardTitle>
              <CardDescription>Your latest AI-generated summaries</CardDescription>
            </div>
            <Link href="/summaries">
              <Button variant="ghost" size="sm" data-testid="link-view-all-summaries">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {statsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.recentSummaries && stats.recentSummaries.length > 0 ? (
                <div className="space-y-1">
                  {stats.recentSummaries.map((summary) => (
                    <RecentSummaryCard key={summary.id} summary={summary} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[180px] text-center">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-3">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No summaries yet</p>
                  <Link href="/upload">
                    <Button variant="link" size="sm" className="mt-2">
                      Upload your first note
                    </Button>
                  </Link>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
            <div>
              <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
              <CardDescription>Your scheduled study activities</CardDescription>
            </div>
            <Link href="/planner">
              <Button variant="ghost" size="sm" data-testid="link-view-planner">
                View Plan
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {statsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="w-2 h-2 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.upcomingTasks && stats.upcomingTasks.length > 0 ? (
                <div className="space-y-1">
                  {stats.upcomingTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[180px] text-center">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-3">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No tasks scheduled</p>
                  <Link href="/planner">
                    <Button variant="link" size="sm" className="mt-2">
                      Create a study plan
                    </Button>
                  </Link>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Subjects Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Subjects</h2>
          <Link href="/subjects">
            <Button variant="ghost" size="sm" data-testid="link-manage-subjects">
              Manage
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {subjectsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="w-10 h-10 rounded-lg mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : subjects && subjects.length > 0 ? (
            <>
              {subjects.slice(0, 4).map((subject) => (
                <SubjectCard key={subject.id} subject={subject} />
              ))}
              <Link href="/subjects">
                <Card className="hover-elevate cursor-pointer h-full border-dashed">
                  <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[120px]">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-2">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">Add Subject</span>
                  </CardContent>
                </Card>
              </Link>
            </>
          ) : (
            <Link href="/subjects">
              <Card className="hover-elevate cursor-pointer col-span-full border-dashed">
                <CardContent className="p-8 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Create Your First Subject</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Organize your study materials by subject
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>

      {/* AI Assistant Prompt */}
      <Card className="bg-gradient-to-r from-primary/5 to-chart-3/5 border-primary/20">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-semibold text-lg">Need help studying?</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Ask our AI tutor anything. Get explanations, examples, and step-by-step solutions.
            </p>
          </div>
          <Link href="/chat">
            <Button data-testid="button-start-chat">
              Start Chatting
              <MessageCircle className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
