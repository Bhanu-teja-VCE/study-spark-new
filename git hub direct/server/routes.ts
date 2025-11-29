import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertSubjectSchema,
  insertNoteSchema,
  summarizeRequestSchema,
  chatRequestSchema,
  generateFlashcardsRequestSchema,
  generateQuestionsRequestSchema,
  generateStudyPlanRequestSchema,
} from "@shared/schema";
import {
  summarizeContent,
  chatWithAI,
  generateFlashcards,
  generateQuestions,
  generateStudyPlan,
} from "./services/groq";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === SUBJECTS ===
  app.get("/api/subjects", async (_req: Request, res: Response) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subjects" });
    }
  });

  app.get("/api/subjects/:id", async (req: Request, res: Response) => {
    try {
      const subject = await storage.getSubject(req.params.id);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subject" });
    }
  });

  app.post("/api/subjects", async (req: Request, res: Response) => {
    try {
      const data = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(data);
      res.status(201).json(subject);
    } catch (error) {
      res.status(400).json({ error: "Invalid subject data" });
    }
  });

  app.patch("/api/subjects/:id", async (req: Request, res: Response) => {
    try {
      const subject = await storage.updateSubject(req.params.id, req.body);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      res.status(500).json({ error: "Failed to update subject" });
    }
  });

  app.delete("/api/subjects/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteSubject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Subject not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete subject" });
    }
  });

  // === NOTES ===
  app.get("/api/notes", async (req: Request, res: Response) => {
    try {
      const subjectId = req.query.subjectId as string | undefined;
      const notes = await storage.getNotes(subjectId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/:id", async (req: Request, res: Response) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch note" });
    }
  });

  app.post("/api/notes", async (req: Request, res: Response) => {
    try {
      const data = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(data);
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid note data" });
    }
  });

  // File upload endpoint
  app.post("/api/notes/upload", async (req: Request, res: Response) => {
    try {
      // For now, we'll handle text-based content
      // In production, you'd use multer for file handling
      const { title, content, subjectId, fileType } = req.body;
      
      if (!title || !content || !subjectId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const note = await storage.createNote({
        title,
        content,
        subjectId,
        fileType: fileType || "text",
      });

      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to upload note" });
    }
  });

  // === SUMMARIES ===
  app.get("/api/summaries", async (req: Request, res: Response) => {
    try {
      const subjectId = req.query.subjectId as string | undefined;
      const summaries = await storage.getSummaries(subjectId);
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch summaries" });
    }
  });

  app.get("/api/summaries/:id", async (req: Request, res: Response) => {
    try {
      const summary = await storage.getSummary(req.params.id);
      if (!summary) {
        return res.status(404).json({ error: "Summary not found" });
      }
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch summary" });
    }
  });

  // === FLASHCARDS ===
  app.get("/api/flashcards", async (req: Request, res: Response) => {
    try {
      const subjectId = req.query.subjectId as string | undefined;
      const flashcards = await storage.getFlashcards(subjectId);
      res.json(flashcards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flashcards" });
    }
  });

  app.patch("/api/flashcards/:id", async (req: Request, res: Response) => {
    try {
      const flashcard = await storage.updateFlashcard(req.params.id, req.body);
      if (!flashcard) {
        return res.status(404).json({ error: "Flashcard not found" });
      }
      res.json(flashcard);
    } catch (error) {
      res.status(500).json({ error: "Failed to update flashcard" });
    }
  });

  // === QUESTIONS ===
  app.get("/api/questions", async (req: Request, res: Response) => {
    try {
      const subjectId = req.query.subjectId as string | undefined;
      const questions = await storage.getQuestions(subjectId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // === STUDY PLANS ===
  app.get("/api/study-plans", async (_req: Request, res: Response) => {
    try {
      const plans = await storage.getStudyPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch study plans" });
    }
  });

  app.patch("/api/study-plans/:planId/tasks/:taskId", async (req: Request, res: Response) => {
    try {
      const plan = await storage.updateStudyPlanTask(
        req.params.planId,
        req.params.taskId,
        req.body
      );
      if (!plan) {
        return res.status(404).json({ error: "Plan or task not found" });
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // === DASHBOARD ===
  app.get("/api/dashboard/stats", async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // === AI ENDPOINTS ===

  // Summarize content
  app.post("/api/ai/summarize", async (req: Request, res: Response) => {
    try {
      const data = summarizeRequestSchema.parse(req.body);
      
      // Generate summary using Groq
      const summaryResult = await summarizeContent(data.content, data.title);
      
      // Store the summary
      const summary = await storage.createSummary({
        noteId: data.noteId,
        subjectId: data.subjectId,
        title: data.title,
        keyPoints: summaryResult.keyPoints,
        definitions: summaryResult.definitions,
        formulas: summaryResult.formulas,
        mainConcepts: summaryResult.mainConcepts,
        fullSummary: summaryResult.fullSummary,
      });

      res.json(summary);
    } catch (error) {
      console.error("Summarize error:", error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  // AI Chat
  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    try {
      const data = chatRequestSchema.parse(req.body);
      const response = await chatWithAI(data.message, data.history);
      res.json({ response });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  // Generate Flashcards
  app.post("/api/ai/flashcards", async (req: Request, res: Response) => {
    try {
      const data = generateFlashcardsRequestSchema.parse(req.body);
      
      // Generate flashcards using Groq
      const flashcardResults = await generateFlashcards(data.content, data.count);
      
      // Store the flashcards
      const flashcards = await storage.createFlashcards(
        flashcardResults.map((f) => ({
          subjectId: data.subjectId,
          summaryId: data.summaryId,
          front: f.front,
          back: f.back,
          difficulty: "medium" as const,
        }))
      );

      res.json(flashcards);
    } catch (error) {
      console.error("Flashcard generation error:", error);
      res.status(500).json({ error: "Failed to generate flashcards" });
    }
  });

  // Generate Questions
  app.post("/api/ai/questions", async (req: Request, res: Response) => {
    try {
      const data = generateQuestionsRequestSchema.parse(req.body);
      
      // Generate questions using Groq
      const questionResults = await generateQuestions(data.content, data.types, data.count);
      
      // Store the questions
      const questions = await storage.createQuestions(
        questionResults.map((q) => ({
          subjectId: data.subjectId,
          summaryId: data.summaryId,
          type: q.type,
          question: q.question,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
        }))
      );

      res.json(questions);
    } catch (error) {
      console.error("Question generation error:", error);
      res.status(500).json({ error: "Failed to generate questions" });
    }
  });

  // Generate Study Plan
  app.post("/api/ai/study-plan", async (req: Request, res: Response) => {
    try {
      const data = generateStudyPlanRequestSchema.parse(req.body);
      
      // Generate study plan using Groq
      const planResult = await generateStudyPlan(data.prompt, data.subjects);
      
      // Store the study plan
      const plan = await storage.createStudyPlan({
        title: planResult.title,
        description: planResult.description,
        startDate: planResult.startDate,
        endDate: planResult.endDate,
        tasks: planResult.tasks.map((t) => ({
          id: "",
          topic: t.topic,
          subject: t.subject,
          duration: t.duration,
          priority: t.priority,
          completed: false,
          date: t.date,
          timeSlot: t.timeSlot,
        })),
      });

      res.json(plan);
    } catch (error) {
      console.error("Study plan generation error:", error);
      res.status(500).json({ error: "Failed to generate study plan" });
    }
  });

  return httpServer;
}
