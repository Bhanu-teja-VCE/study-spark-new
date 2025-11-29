import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  HelpCircle,
  Sparkles,
  BookOpen,
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { Question, Subject, Summary } from "@shared/schema";

function QuestionCard({ 
  question,
  index,
}: { 
  question: Question;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const difficultyColors = {
    easy: "bg-chart-2/10 text-chart-2",
    medium: "bg-chart-4/10 text-chart-4",
    hard: "bg-destructive/10 text-destructive",
  };

  const typeLabels = {
    mcq: "Multiple Choice",
    short: "Short Answer",
    long: "Long Answer",
    numerical: "Numerical",
  };

  const isCorrect = selectedAnswer === question.answer;

  const handleCheckAnswer = () => {
    if (question.type === "mcq" && selectedAnswer) {
      setShowAnswer(true);
    } else {
      setShowAnswer(true);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div
          className="p-4 cursor-pointer hover-elevate"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid={`question-card-${index}`}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-semibold text-sm">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="secondary" className="text-xs">
                  {typeLabels[question.type]}
                </Badge>
                <Badge className={`text-xs ${difficultyColors[question.difficulty]}`}>
                  {question.difficulty}
                </Badge>
              </div>
              <p className="font-medium">{question.question}</p>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t pt-4 space-y-4">
            {question.type === "mcq" && question.options && (
              <RadioGroup
                value={selectedAnswer || ""}
                onValueChange={setSelectedAnswer}
                disabled={showAnswer}
              >
                <div className="space-y-2">
                  {question.options.map((option, i) => (
                    <div
                      key={i}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                        showAnswer
                          ? option === question.answer
                            ? "bg-chart-2/10 border-chart-2"
                            : selectedAnswer === option
                            ? "bg-destructive/10 border-destructive"
                            : ""
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroupItem value={option} id={`option-${index}-${i}`} />
                      <Label
                        htmlFor={`option-${index}-${i}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option}
                      </Label>
                      {showAnswer && option === question.answer && (
                        <CheckCircle className="h-5 w-5 text-chart-2" />
                      )}
                      {showAnswer && selectedAnswer === option && option !== question.answer && (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {!showAnswer && (
              <Button
                onClick={handleCheckAnswer}
                disabled={question.type === "mcq" && !selectedAnswer}
                data-testid={`button-check-answer-${index}`}
              >
                {question.type === "mcq" ? "Check Answer" : "Show Answer"}
              </Button>
            )}

            {showAnswer && (
              <div className="space-y-3">
                {question.type !== "mcq" && (
                  <div className="p-4 rounded-lg bg-chart-2/10 border border-chart-2">
                    <p className="text-sm font-medium text-chart-2 mb-1">Answer:</p>
                    <p>{question.answer}</p>
                  </div>
                )}
                {question.explanation && (
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm font-medium mb-1">Explanation:</p>
                    <p className="text-sm text-muted-foreground">{question.explanation}</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAnswer(false);
                    setSelectedAnswer(null);
                  }}
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function QuestionsPage() {
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [generateContent, setGenerateContent] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["mcq", "short"]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: questions, isLoading } = useQuery<Question[]>({
    queryKey: [selectedSubject === "all" ? "/api/questions" : `/api/questions?subjectId=${selectedSubject}`],
  });

  const { data: summaries } = useQuery<Summary[]>({
    queryKey: ["/api/summaries"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { content: string; subjectId: string; types: string[]; count: number }) => {
      const response = await apiRequest("POST", "/api/ai/questions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      setGenerateContent("");
      toast({
        title: "Questions generated!",
        description: "New practice questions have been added.",
      });
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Could not generate questions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!generateContent.trim()) {
      toast({
        title: "No content",
        description: "Please enter some content to generate questions from.",
        variant: "destructive",
      });
      return;
    }

    if (selectedTypes.length === 0) {
      toast({
        title: "No question types",
        description: "Please select at least one question type.",
        variant: "destructive",
      });
      return;
    }

    const subjectId = selectedSubject !== "all" ? selectedSubject : subjects?.[0]?.id;
    if (!subjectId) {
      toast({
        title: "No subject",
        description: "Please create a subject first.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      content: generateContent,
      subjectId,
      types: selectedTypes,
      count: 10,
    });
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const filteredQuestions = questions?.filter((q) => {
    if (selectedSubject !== "all" && q.subjectId !== selectedSubject) return false;
    if (selectedType !== "all" && q.type !== selectedType) return false;
    return true;
  }) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Practice Questions</h1>
          <p className="text-muted-foreground mt-1">
            Test your knowledge with AI-generated questions
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[150px]" data-testid="select-subject-filter">
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects?.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[150px]" data-testid="select-type-filter">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="mcq">Multiple Choice</SelectItem>
              <SelectItem value="short">Short Answer</SelectItem>
              <SelectItem value="long">Long Answer</SelectItem>
              <SelectItem value="numerical">Numerical</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-generate-questions">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Generate Questions</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select question types to generate:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "mcq", label: "Multiple Choice" },
                      { id: "short", label: "Short Answer" },
                      { id: "long", label: "Long Answer" },
                      { id: "numerical", label: "Numerical" },
                    ].map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={type.id}
                          checked={selectedTypes.includes(type.id)}
                          onCheckedChange={() => toggleType(type.id)}
                        />
                        <Label htmlFor={type.id} className="text-sm">
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Enter content to generate questions from:
                  </p>
                  <Textarea
                    value={generateContent}
                    onChange={(e) => setGenerateContent(e.target.value)}
                    placeholder="Enter content to generate questions from..."
                    className="min-h-[150px]"
                    data-testid="textarea-question-content"
                  />
                </div>
                {summaries && summaries.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Or select from summaries:</p>
                    <ScrollArea className="h-[120px]">
                      <div className="space-y-2">
                        {summaries.map((summary) => (
                          <Button
                            key={summary.id}
                            variant="outline"
                            className="w-full justify-start text-left h-auto py-2"
                            onClick={() => setGenerateContent(summary.fullSummary)}
                          >
                            <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{summary.title}</span>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                <Button
                  onClick={handleGenerate}
                  disabled={!generateContent.trim() || selectedTypes.length === 0 || generateMutation.isPending}
                  className="w-full"
                  data-testid="button-confirm-generate"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Questions
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredQuestions.length > 0 ? (
        <div className="space-y-4">
          {filteredQuestions.map((question, index) => (
            <QuestionCard key={question.id} question={question} index={index} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No questions yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Generate practice questions from your notes or summaries to start testing your knowledge.
            </p>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first-question">
              <Plus className="h-4 w-4 mr-2" />
              Generate Questions
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {filteredQuestions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">
                {filteredQuestions.filter((q) => q.type === "mcq").length}
              </p>
              <p className="text-sm text-muted-foreground">MCQs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">
                {filteredQuestions.filter((q) => q.type === "short").length}
              </p>
              <p className="text-sm text-muted-foreground">Short</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">
                {filteredQuestions.filter((q) => q.type === "long").length}
              </p>
              <p className="text-sm text-muted-foreground">Long</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">
                {filteredQuestions.filter((q) => q.type === "numerical").length}
              </p>
              <p className="text-sm text-muted-foreground">Numerical</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
