import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Brain,
  HelpCircle,
  Download,
  BookOpen,
  Lightbulb,
  Calculator,
  Loader2,
} from "lucide-react";
import type { Summary, Subject } from "@shared/schema";

export default function SummaryPage() {
  const [, params] = useRoute("/summaries/:id");
  const { toast } = useToast();

  const { data: summary, isLoading } = useQuery<Summary>({
    queryKey: ["/api/summaries", params?.id],
    enabled: !!params?.id,
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const generateFlashcardsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/flashcards", {
        content: summary?.fullSummary,
        subjectId: summary?.subjectId,
        summaryId: summary?.id,
        count: 10,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
      toast({
        title: "Flashcards generated!",
        description: "New flashcards have been added to your deck.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate flashcards.",
        variant: "destructive",
      });
    },
  });

  const generateQuestionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/questions", {
        content: summary?.fullSummary,
        subjectId: summary?.subjectId,
        summaryId: summary?.id,
        types: ["mcq", "short"],
        count: 10,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Questions generated!",
        description: "New practice questions have been added.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate questions.",
        variant: "destructive",
      });
    },
  });

  const subject = subjects?.find((s) => s.id === summary?.subjectId);

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-32" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-5/6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Summary not found</h2>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">{summary.title}</h1>
          {subject && (
            <Badge variant="secondary" className="mt-2">
              {subject.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateFlashcardsMutation.mutate()}
            disabled={generateFlashcardsMutation.isPending}
            data-testid="button-generate-flashcards"
          >
            {generateFlashcardsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            Flashcards
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateQuestionsMutation.mutate()}
            disabled={generateQuestionsMutation.isPending}
            data-testid="button-generate-questions"
          >
            {generateQuestionsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <HelpCircle className="h-4 w-4 mr-2" />
            )}
            Questions
          </Button>
        </div>
      </div>

      {/* Main Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {summary.fullSummary.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Points */}
      {summary.keyPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-chart-4" />
              Key Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-chart-4/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-chart-4">{index + 1}</span>
                  </div>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Definitions */}
      {summary.definitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-chart-1" />
              Definitions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.definitions.map((def, index) => (
                <div key={index}>
                  <dt className="font-semibold text-primary">{def.term}</dt>
                  <dd className="text-muted-foreground mt-1 pl-4 border-l-2 border-primary/20">
                    {def.definition}
                  </dd>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulas */}
      {summary.formulas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-chart-3" />
              Formulas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {summary.formulas.map((formula, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-muted font-mono text-sm"
                >
                  {formula}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Concepts */}
      {summary.mainConcepts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-chart-2" />
              Main Concepts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.mainConcepts.map((concept, index) => (
                <Badge key={index} variant="secondary">
                  {concept}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4 pt-4">
        <Link href="/chat">
          <Button variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            Ask AI about this
          </Button>
        </Link>
        <Link href="/upload">
          <Button>
            Upload More Notes
          </Button>
        </Link>
      </div>
    </div>
  );
}
