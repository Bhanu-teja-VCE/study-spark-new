import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Upload,
  FileText,
  Image,
  File,
  X,
  Sparkles,
  Loader2,
  CheckCircle,
  Plus,
} from "lucide-react";
import type { Subject, Summary } from "@shared/schema";

type FileWithPreview = File & {
  preview?: string;
};

export default function UploadPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("file");
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [textContent, setTextContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/subjects", { name });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      setSelectedSubject(data.id);
      toast({
        title: "Subject created",
        description: `${data.name} has been added to your subjects.`,
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/notes/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      processNote(data.id, data.content);
    },
    onError: () => {
      setIsProcessing(false);
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const summarizeMutation = useMutation({
    mutationFn: async (data: { content: string; noteId: string; subjectId: string; title: string }) => {
      const response = await apiRequest("POST", "/api/ai/summarize", data);
      return response.json();
    },
    onSuccess: (data: Summary) => {
      queryClient.invalidateQueries({ queryKey: ["/api/summaries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsProcessing(false);
      setProcessingProgress(100);
      toast({
        title: "Summary created!",
        description: "Your notes have been analyzed and summarized.",
      });
      navigate(`/summaries/${data.id}`);
    },
    onError: () => {
      setIsProcessing(false);
      toast({
        title: "Processing failed",
        description: "Could not generate summary. Please try again.",
        variant: "destructive",
      });
    },
  });

  const processNote = async (noteId: string, content: string) => {
    setProcessingStep("Analyzing content...");
    setProcessingProgress(40);
    
    await new Promise(r => setTimeout(r, 500));
    setProcessingStep("Generating summary...");
    setProcessingProgress(60);

    summarizeMutation.mutate({
      content,
      noteId,
      subjectId: selectedSubject,
      title: noteTitle || "Untitled Note",
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(
      acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
        })
      )
    );
    if (acceptedFiles.length > 0 && !noteTitle) {
      setNoteTitle(acceptedFiles[0].name.replace(/\.[^/.]+$/, ""));
    }
  }, [noteTitle]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async () => {
    if (!selectedSubject) {
      toast({
        title: "Select a subject",
        description: "Please select or create a subject first.",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === "file" && files.length === 0) {
      toast({
        title: "No file selected",
        description: "Please upload a file to continue.",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === "text" && !textContent.trim()) {
      toast({
        title: "No content",
        description: "Please enter some text to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStep("Uploading...");
    setProcessingProgress(20);

    if (activeTab === "file") {
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("title", noteTitle || files[0].name);
      formData.append("subjectId", selectedSubject);
      uploadMutation.mutate(formData);
    } else {
      // For text content, create note directly
      try {
        const response = await apiRequest("POST", "/api/notes", {
          title: noteTitle || "Untitled Note",
          content: textContent,
          subjectId: selectedSubject,
          fileType: "text",
        });
        const data = await response.json();
        queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
        processNote(data.id, textContent);
      } catch {
        setIsProcessing(false);
        toast({
          title: "Error",
          description: "Failed to save note. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type === "application/pdf") return <File className="h-8 w-8 text-destructive" />;
    if (file.type.startsWith("image/")) return <Image className="h-8 w-8 text-chart-2" />;
    return <FileText className="h-8 w-8 text-chart-1" />;
  };

  if (isProcessing) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              {processingProgress === 100 ? (
                <CheckCircle className="h-8 w-8 text-primary" />
              ) : (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              )}
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {processingProgress === 100 ? "Complete!" : "Processing Your Notes"}
            </h2>
            <p className="text-muted-foreground mb-6">{processingStep}</p>
            <Progress value={processingProgress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">{processingProgress}%</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Upload Notes</h1>
        <p className="text-muted-foreground mt-1">
          Upload your study materials and let AI create summaries, flashcards, and questions.
        </p>
      </div>

      {/* Subject Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Subject</CardTitle>
          <CardDescription>Choose which subject these notes belong to</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {subjects?.map((subject) => (
              <Badge
                key={subject.id}
                variant={selectedSubject === subject.id ? "default" : "outline"}
                className="cursor-pointer text-sm py-1.5 px-3"
                onClick={() => setSelectedSubject(subject.id)}
                data-testid={`badge-subject-${subject.id}`}
              >
                {subject.name}
              </Badge>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const name = prompt("Enter subject name:");
                if (name) createSubjectMutation.mutate(name);
              }}
              data-testid="button-add-subject"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Subject
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Note Title */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Note Title</CardTitle>
          <CardDescription>Give your notes a descriptive title</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g., Chapter 5 - Thermodynamics"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            data-testid="input-note-title"
          />
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Content</CardTitle>
          <CardDescription>Upload a file or paste your notes</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="file" data-testid="tab-file-upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="text" data-testid="tab-text-input">
                <FileText className="h-4 w-4 mr-2" />
                Paste Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file">
              {files.length === 0 ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                  data-testid="dropzone-upload"
                >
                  <input {...getInputProps()} data-testid="input-file-upload" />
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium mb-1">
                    {isDragActive ? "Drop your file here" : "Drag & drop your file here"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <File className="h-4 w-4" /> PDF
                    </span>
                    <span className="flex items-center gap-1">
                      <Image className="h-4 w-4" /> Images
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" /> Text
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-lg bg-muted/50"
                    >
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                          {getFileIcon(file)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        data-testid="button-remove-file"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div
                    {...getRootProps()}
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <input {...getInputProps()} />
                    <p className="text-sm text-muted-foreground">
                      Drop another file or click to replace
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="text">
              <Textarea
                placeholder="Paste your notes here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="min-h-[300px] resize-none"
                data-testid="textarea-note-content"
              />
              <p className="text-xs text-muted-foreground mt-2 text-right">
                {textContent.length} characters
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setFiles([]);
            setTextContent("");
            setNoteTitle("");
          }}
          data-testid="button-clear"
        >
          Clear
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            !selectedSubject ||
            (activeTab === "file" && files.length === 0) ||
            (activeTab === "text" && !textContent.trim())
          }
          data-testid="button-process-notes"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Process with AI
        </Button>
      </div>
    </div>
  );
}
