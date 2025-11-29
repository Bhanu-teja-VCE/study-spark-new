import { pgTable, text, integer, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Subject schema
export const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").default("book"),
  color: text("color").default("blue"),
  notesCount: integer("notes_count").default(0),
  flashcardsCount: integer("flashcards_count").default(0),
  questionsCount: integer("questions_count").default(0),
  lastAccessed: timestamp("last_accessed").defaultNow(),
});

export const subjectSchema = createSelectSchema(subjects);
export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  notesCount: true,
  flashcardsCount: true,
  questionsCount: true,
  lastAccessed: true
});
export type Subject = z.infer<typeof subjectSchema>;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

// Note schema
export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  fileType: text("file_type").default("text"),
  fileName: text("file_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const noteSchema = createSelectSchema(notes);
export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true });
export type Note = z.infer<typeof noteSchema>;
export type InsertNote = z.infer<typeof insertNoteSchema>;

// Summary schema
export const summaries = pgTable("summaries", {
  id: uuid("id").defaultRandom().primaryKey(),
  noteId: uuid("note_id").notNull(),
  subjectId: uuid("subject_id").notNull(),
  title: text("title").notNull(),
  keyPoints: jsonb("key_points").$type<string[]>().notNull(),
  definitions: jsonb("definitions").$type<{ term: string, definition: string }[]>().notNull(),
  formulas: jsonb("formulas").$type<string[]>().notNull(),
  mainConcepts: jsonb("main_concepts").$type<string[]>().notNull(),
  fullSummary: text("full_summary").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const summarySchema = createSelectSchema(summaries);
export const insertSummarySchema = createInsertSchema(summaries).omit({ id: true, createdAt: true });
export type Summary = z.infer<typeof summarySchema>;
export type InsertSummary = z.infer<typeof insertSummarySchema>;

// Flashcard schema
export const flashcards = pgTable("flashcards", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id").notNull(),
  summaryId: uuid("summary_id"),
  front: text("front").notNull(),
  back: text("back").notNull(),
  difficulty: text("difficulty").default("medium"),
  lastReviewed: timestamp("last_reviewed"),
  timesReviewed: integer("times_reviewed").default(0),
});

export const flashcardSchema = createSelectSchema(flashcards);
export const insertFlashcardSchema = createInsertSchema(flashcards).omit({ id: true, lastReviewed: true, timesReviewed: true });
export type Flashcard = z.infer<typeof flashcardSchema>;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;

// Question schema
export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id").notNull(),
  summaryId: uuid("summary_id"),
  type: text("type").notNull(), // mcq, short, long, numerical
  question: text("question").notNull(),
  options: jsonb("options").$type<string[]>(),
  answer: text("answer").notNull(),
  explanation: text("explanation"),
  difficulty: text("difficulty").default("medium"),
});

export const questionSchema = createSelectSchema(questions);
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export type Question = z.infer<typeof questionSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

// Study Plan schema
// We need to define types for the JSONB content first
const studyTaskType = z.object({
  id: z.string(),
  topic: z.string(),
  subject: z.string(),
  duration: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  completed: z.boolean().default(false),
  date: z.string(),
  timeSlot: z.string().optional(),
});

export const studyPlans = pgTable("study_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  tasks: jsonb("tasks").$type<z.infer<typeof studyTaskType>[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studyPlanSchema = createSelectSchema(studyPlans);
export const insertStudyPlanSchema = createInsertSchema(studyPlans).omit({ id: true, createdAt: true });
export type StudyPlan = z.infer<typeof studyPlanSchema>;
export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;
export type StudyTask = z.infer<typeof studyTaskType>;

// AI Request/Response schemas (Keep these as Zod objects since they are not DB tables)
export const summarizeRequestSchema = z.object({
  content: z.string().min(1),
  noteId: z.string(),
  subjectId: z.string(),
  title: z.string(),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
});

export const generateFlashcardsRequestSchema = z.object({
  content: z.string().min(1),
  subjectId: z.string(),
  summaryId: z.string().optional(),
  count: z.number().min(1).max(20).default(10),
});

export const generateQuestionsRequestSchema = z.object({
  content: z.string().min(1),
  subjectId: z.string(),
  summaryId: z.string().optional(),
  types: z.array(z.enum(["mcq", "short", "long", "numerical"])).default(["mcq", "short"]),
  count: z.number().min(1).max(20).default(10),
});

export const generateStudyPlanRequestSchema = z.object({
  prompt: z.string().min(1),
  subjects: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type SummarizeRequest = z.infer<typeof summarizeRequestSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type GenerateFlashcardsRequest = z.infer<typeof generateFlashcardsRequestSchema>;
export type GenerateQuestionsRequest = z.infer<typeof generateQuestionsRequestSchema>;
export type GenerateStudyPlanRequest = z.infer<typeof generateStudyPlanRequestSchema>;

// Dashboard stats
export interface DashboardStats {
  totalSubjects: number;
  totalNotes: number;
  totalFlashcards: number;
  totalQuestions: number;
  studyStreak: number;
  recentSummaries: Summary[];
  upcomingTasks: StudyTask[];
}
