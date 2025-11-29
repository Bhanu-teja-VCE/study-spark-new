import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  FolderOpen,
  Plus,
  BookOpen,
  FileText,
  Brain,
  HelpCircle,
  MoreVertical,
  Trash2,
  Edit2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Subject } from "@shared/schema";

const colorOptions = [
  { value: "blue", label: "Blue", class: "bg-chart-1" },
  { value: "green", label: "Green", class: "bg-chart-2" },
  { value: "purple", label: "Purple", class: "bg-chart-3" },
  { value: "orange", label: "Orange", class: "bg-chart-4" },
  { value: "pink", label: "Pink", class: "bg-chart-5" },
];

function SubjectCard({ subject, onEdit, onDelete }: { 
  subject: Subject; 
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-chart-1/10 text-chart-1",
    green: "bg-chart-2/10 text-chart-2",
    purple: "bg-chart-3/10 text-chart-3",
    orange: "bg-chart-4/10 text-chart-4",
    pink: "bg-chart-5/10 text-chart-5",
  };

  return (
    <Card className="hover-elevate group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg ${colorClasses[subject.color] || colorClasses.blue} flex items-center justify-center`}>
            <BookOpen className="h-6 w-6" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(subject)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(subject.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Link href={`/subjects/${subject.id}`}>
          <h3 className="font-semibold text-lg mb-3 hover:text-primary transition-colors">
            {subject.name}
          </h3>
        </Link>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <p className="font-semibold">{subject.notesCount}</p>
            <p className="text-xs text-muted-foreground">Notes</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Brain className="h-3.5 w-3.5" />
            </div>
            <p className="font-semibold">{subject.flashcardsCount}</p>
            <p className="text-xs text-muted-foreground">Cards</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <HelpCircle className="h-3.5 w-3.5" />
            </div>
            <p className="font-semibold">{subject.questionsCount}</p>
            <p className="text-xs text-muted-foreground">Questions</p>
          </div>
        </div>
        {subject.lastAccessed && (
          <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
            Last accessed: {new Date(subject.lastAccessed).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function SubjectsPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");

  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const response = await apiRequest("POST", "/api/subjects", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "Subject created",
        description: "Your new subject has been added.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create subject. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; color: string } }) => {
      const response = await apiRequest("PATCH", `/api/subjects/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "Subject updated",
        description: "Your subject has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update subject. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Subject deleted",
        description: "The subject has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete subject. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setColor("blue");
    setEditingSubject(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setName(subject.name);
    setColor(subject.color);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a subject name.",
        variant: "destructive",
      });
      return;
    }

    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, data: { name, color } });
    } else {
      createMutation.mutate({ name, color });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this subject? All associated notes, flashcards, and questions will also be deleted.")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Subjects</h1>
          <p className="text-muted-foreground mt-1">
            Organize your study materials by subject
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate} data-testid="button-add-subject">
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSubject ? "Edit Subject" : "Create Subject"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Mathematics, Physics, History"
                  data-testid="input-subject-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger data-testid="select-subject-color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${option.class}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!name.trim() || createMutation.isPending || updateMutation.isPending}
                className="w-full"
                data-testid="button-save-subject"
              >
                {editingSubject ? "Save Changes" : "Create Subject"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subjects Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="w-12 h-12 rounded-lg mb-4" />
                <Skeleton className="h-6 w-3/4 mb-4" />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : subjects && subjects.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No subjects yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Create subjects to organize your notes, flashcards, and questions.
            </p>
            <Button onClick={handleOpenCreate} data-testid="button-create-first-subject">
              <Plus className="h-4 w-4 mr-2" />
              Create First Subject
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
