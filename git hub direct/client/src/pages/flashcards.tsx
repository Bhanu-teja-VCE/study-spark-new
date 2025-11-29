import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  BookOpen,
  Loader2,
  Plus,
} from "lucide-react";
import type { Flashcard, Subject, Summary } from "@shared/schema";

function FlashcardViewer({ 
  flashcards, 
  onMarkDifficulty 
}: { 
  flashcards: Flashcard[];
  onMarkDifficulty: (id: string, difficulty: "easy" | "hard") => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleMark = (difficulty: "easy" | "hard") => {
    if (currentCard) {
      onMarkDifficulty(currentCard.id, difficulty);
      setCompleted((prev) => new Set([...prev, currentCard.id]));
      handleNext();
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted(new Set());
  };

  if (!currentCard) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Brain className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No flashcards available</p>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <div className="flex flex-col items-center">
      {/* Progress */}
      <div className="w-full max-w-xl mb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>{currentIndex + 1} of {flashcards.length}</span>
          <span>{completed.size} reviewed</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div 
        className="w-full max-w-xl aspect-[3/2] perspective-1000 cursor-pointer mb-6"
        onClick={() => setIsFlipped(!isFlipped)}
        data-testid="flashcard-container"
      >
        <div 
          className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <Card 
            className="absolute w-full h-full backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
              <Badge variant="secondary" className="mb-4">Question</Badge>
              <p className="text-xl font-medium">{currentCard.front}</p>
              <p className="text-sm text-muted-foreground mt-4">Click to reveal answer</p>
            </CardContent>
          </Card>

          {/* Back */}
          <Card 
            className="absolute w-full h-full backface-hidden bg-primary text-primary-foreground"
            style={{ 
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
              <Badge variant="secondary" className="mb-4 bg-primary-foreground/20 text-primary-foreground">Answer</Badge>
              <p className="text-xl font-medium">{currentCard.back}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          data-testid="button-prev-card"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          onClick={() => handleMark("hard")}
          className="gap-2"
          data-testid="button-mark-hard"
        >
          <ThumbsDown className="h-4 w-4" />
          Hard
        </Button>

        <Button
          onClick={() => handleMark("easy")}
          className="gap-2"
          data-testid="button-mark-easy"
        >
          <ThumbsUp className="h-4 w-4" />
          Easy
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          data-testid="button-next-card"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Reset */}
      {completed.size > 0 && (
        <Button
          variant="ghost"
          className="mt-4 gap-2"
          onClick={handleReset}
          data-testid="button-reset-cards"
        >
          <RotateCcw className="h-4 w-4" />
          Start Over
        </Button>
      )}
    </div>
  );
}

export default function FlashcardsPage() {
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [generateContent, setGenerateContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: flashcards, isLoading } = useQuery<Flashcard[]>({
    queryKey: [selectedSubject === "all" ? "/api/flashcards" : `/api/flashcards?subjectId=${selectedSubject}`],
  });

  const { data: summaries } = useQuery<Summary[]>({
    queryKey: ["/api/summaries"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { content: string; subjectId: string; count: number }) => {
      const response = await apiRequest("POST", "/api/ai/flashcards", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      setGenerateContent("");
      toast({
        title: "Flashcards generated!",
        description: "New flashcards have been added to your deck.",
      });
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Could not generate flashcards. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateDifficultyMutation = useMutation({
    mutationFn: async ({ id, difficulty }: { id: string; difficulty: "easy" | "hard" }) => {
      const response = await apiRequest("PATCH", `/api/flashcards/${id}`, { difficulty });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
    },
  });

  const handleGenerate = () => {
    if (!generateContent.trim()) {
      toast({
        title: "No content",
        description: "Please enter some content to generate flashcards from.",
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
      count: 10,
    });
  };

  const filteredFlashcards = flashcards?.filter(
    (f) => selectedSubject === "all" || f.subjectId === selectedSubject
  ) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Flashcards</h1>
          <p className="text-muted-foreground mt-1">
            Review and practice with AI-generated flashcards
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[180px]" data-testid="select-subject-filter">
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-generate-flashcards">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Flashcards</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Paste content or select a summary to generate flashcards from:
                  </p>
                  <Textarea
                    value={generateContent}
                    onChange={(e) => setGenerateContent(e.target.value)}
                    placeholder="Enter content to generate flashcards from..."
                    className="min-h-[150px]"
                    data-testid="textarea-flashcard-content"
                  />
                </div>
                {summaries && summaries.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Or select from summaries:</p>
                    <ScrollArea className="h-[150px]">
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
                  disabled={!generateContent.trim() || generateMutation.isPending}
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
                      Generate Flashcards
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Flashcard Viewer */}
      <Card>
        <CardContent className="p-8">
          {isLoading ? (
            <div className="flex flex-col items-center py-8">
              <Skeleton className="w-full max-w-xl aspect-[3/2] rounded-lg" />
              <div className="flex gap-4 mt-6">
                <Skeleton className="w-10 h-10 rounded-md" />
                <Skeleton className="w-24 h-10 rounded-md" />
                <Skeleton className="w-24 h-10 rounded-md" />
                <Skeleton className="w-10 h-10 rounded-md" />
              </div>
            </div>
          ) : filteredFlashcards.length > 0 ? (
            <FlashcardViewer
              flashcards={filteredFlashcards}
              onMarkDifficulty={(id, difficulty) =>
                updateDifficultyMutation.mutate({ id, difficulty })
              }
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Brain className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No flashcards yet</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                Generate flashcards from your notes or summaries to start practicing.
              </p>
              <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first-flashcard">
                <Plus className="h-4 w-4 mr-2" />
                Create Flashcards
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {filteredFlashcards.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-chart-2">
                {filteredFlashcards.filter((f) => f.difficulty === "easy").length}
              </p>
              <p className="text-sm text-muted-foreground">Easy</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-chart-4">
                {filteredFlashcards.filter((f) => f.difficulty === "medium").length}
              </p>
              <p className="text-sm text-muted-foreground">Medium</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">
                {filteredFlashcards.filter((f) => f.difficulty === "hard").length}
              </p>
              <p className="text-sm text-muted-foreground">Hard</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
