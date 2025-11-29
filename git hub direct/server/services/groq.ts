import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  console.warn("GROQ_API_KEY environment variable not set");
}

// Initialize Groq client with explicit API key from environment
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

// Use gemma-7b-it - stable and widely available model
const MODEL = "llama-3.3-70b-versatile";

interface SummaryResult {
  keyPoints: string[];
  definitions: { term: string; definition: string }[];
  formulas: string[];
  mainConcepts: string[];
  fullSummary: string;
}

interface FlashcardResult {
  front: string;
  back: string;
}

interface QuestionResult {
  type: "mcq" | "short" | "long" | "numerical";
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
}

interface StudyPlanResult {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  tasks: {
    topic: string;
    subject: string;
    duration: string;
    priority: "high" | "medium" | "low";
    date: string;
    timeSlot?: string;
  }[];
}

export async function summarizeContent(content: string, title: string): Promise<SummaryResult> {
  const prompt = `You are an expert study assistant. Analyze the following study material and create a comprehensive summary.

Title: ${title}

Content:
${content.substring(0, 3000)}

Create a structured summary with the following format. Respond with valid JSON only:
{
  "keyPoints": ["key point 1", "key point 2", ...],
  "definitions": [{"term": "term1", "definition": "definition1"}, ...],
  "formulas": ["formula1", "formula2", ...],
  "mainConcepts": ["concept1", "concept2", ...],
  "fullSummary": "A comprehensive 2-3 paragraph summary of the content"
}

Rules:
- Extract 5-10 key points that capture the main ideas
- Identify important terms and their definitions
- Extract any formulas or equations mentioned
- List the main concepts covered
- Write a clear, comprehensive summary that a student can use for revision
- If there are no formulas, return an empty array
- If there are no definitions, return an empty array`;

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a helpful study assistant that creates clear, structured summaries. Always respond with valid JSON only, no additional text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      keyPoints: result.keyPoints || [],
      definitions: result.definitions || [],
      formulas: result.formulas || [],
      mainConcepts: result.mainConcepts || [],
      fullSummary: result.fullSummary || "Summary not available.",
    };
  } catch (error) {
    console.error("Error summarizing content:", error);
    throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function chatWithAI(
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const systemPrompt = `You are StudySpark AI, a friendly and knowledgeable study tutor. Your role is to:
- Explain concepts clearly and simply
- Provide helpful examples and analogies
- Break down complex topics into digestible parts
- Answer questions with patience and encouragement
- Help students understand rather than just memorize
- Use step-by-step explanations for problems
- Be supportive and motivating

Always respond in a clear, educational manner suitable for students.`;

  try {
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    });

    return response.choices[0].message.content || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error in AI chat:", JSON.stringify(error, null, 2));
    throw new Error("Failed to get AI response");
  }
}

export async function generateFlashcards(
  content: string,
  count: number = 10
): Promise<FlashcardResult[]> {
  const finalCount = Math.min(count, 10); // Limit to 10 to avoid token overflow
  const prompt = `Create ${finalCount} flashcards from the following study material. Each flashcard should test understanding of a key concept.

Content:
${content.substring(0, 2000)}

Respond with valid JSON only in this format:
{
  "flashcards": [
    {"front": "Question or term", "back": "Answer or definition"},
    ...
  ]
}

Rules:
- Create exactly ${finalCount} flashcards
- Questions should be clear and specific
- Answers should be concise but complete
- Cover the most important concepts
- Include a mix of definitions, concepts, and application questions`;

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert educator. Respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.flashcards || [];
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw new Error(`Failed to generate flashcards: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function generateQuestions(
  content: string,
  types: string[] = ["mcq", "short"],
  count: number = 10
): Promise<QuestionResult[]> {
  const finalCount = Math.min(count, 8); // Limit to 8 questions
  const typeDescriptions = {
    mcq: "Multiple choice questions with 4 options",
    short: "Short answer questions (1-2 sentences)",
    long: "Long answer questions requiring detailed explanation",
    numerical: "Numerical/calculation problems",
  };

  const selectedTypes = types.map((t) => typeDescriptions[t as keyof typeof typeDescriptions]).join(", ");

  const prompt = `Create ${finalCount} practice questions from the following study material.

Question types to include: ${selectedTypes}

Content:
${content.substring(0, 2000)}

Respond with valid JSON only with these questions:
{
  "questions": [
    {
      "type": "mcq|short|long|numerical",
      "question": "The question text",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "answer": "The correct answer",
      "explanation": "Brief explanation",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "Create practice questions. Respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.questions || [];
  } catch (error) {
    console.error("Error generating questions:", error);
    throw new Error(`Failed to generate questions: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function generateStudyPlan(
  prompt: string,
  subjects: string[] = []
): Promise<StudyPlanResult> {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const subjectContext = subjects.length > 0
    ? `Available subjects: ${subjects.join(", ")}`
    : "Create appropriate subject names based on the request";

  const systemPrompt = `You are a study planning expert. Create personalized, realistic study plans for students.
  
Today's date is: ${todayStr}
${subjectContext}

When creating study plans:
- Be realistic about time requirements
- Prioritize based on urgency and difficulty
- Include breaks and review sessions
- Consider spaced repetition principles
- Create manageable daily chunks`;

  const userPrompt = `Create a detailed study plan based on this request: "${prompt}"

Respond with valid JSON only in this format:
{
  "title": "Plan title",
  "description": "Brief description of the plan",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "tasks": [
    {
      "topic": "What to study",
      "subject": "Subject name",
      "duration": "1-2 hours",
      "priority": "high|medium|low",
      "date": "YYYY-MM-DD",
      "timeSlot": "Morning|Afternoon|Evening"
    },
    ...
  ]
}

Rules:
- Start date should be today (${todayStr}) unless specified otherwise
- Create 5-15 tasks depending on the timeframe
- Distribute tasks evenly across the available days
- High priority for urgent/difficult topics
- Include review sessions for previously covered material
- Each task should be achievable in the given duration`;

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Ensure valid dates
    if (!result.startDate) result.startDate = todayStr;
    if (!result.endDate) {
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 7);
      result.endDate = endDate.toISOString().split("T")[0];
    }

    return {
      title: result.title || "Study Plan",
      description: result.description || "Your personalized study plan",
      startDate: result.startDate,
      endDate: result.endDate,
      tasks: (result.tasks || []).map((t: any) => ({
        topic: t.topic || "Study session",
        subject: t.subject || "General",
        duration: t.duration || "1 hour",
        priority: t.priority || "medium",
        date: t.date || todayStr,
        timeSlot: t.timeSlot,
      })),
    };
  } catch (error) {
    console.error("Error generating study plan:", error);
    throw new Error("Failed to generate study plan");
  }
}
