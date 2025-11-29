import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Brain,
  MessageCircle,
  FileText,
  Calendar,
  Sparkles,
  Upload,
  Zap,
  Target,
  CheckCircle,
  ArrowRight
} from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Upload Notes",
    description: "Upload PDFs, images, or paste text. Our AI analyzes your study materials instantly.",
  },
  {
    icon: FileText,
    title: "Smart Summaries",
    description: "Get clean summaries with key points, definitions, formulas, and main concepts.",
  },
  {
    icon: MessageCircle,
    title: "AI Chat Tutor",
    description: "Ask doubts anytime. Get clear explanations, examples, and step-by-step solutions.",
  },
  {
    icon: Brain,
    title: "Auto Flashcards",
    description: "Generate flashcards automatically from any topic for better memory retention.",
  },
  {
    icon: Target,
    title: "Practice Questions",
    description: "AI creates MCQs, short answers, and practice problems tailored to your content.",
  },
  {
    icon: Calendar,
    title: "Study Planner",
    description: "Get personalized study schedules based on your exams and available time.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Upload Your Notes",
    description: "Drop any PDF, image, or paste your study material",
  },
  {
    step: "02",
    title: "AI Analyzes Content",
    description: "Our AI extracts key concepts, definitions, and formulas",
  },
  {
    step: "03",
    title: "Generate Study Tools",
    description: "Create flashcards, questions, and summaries instantly",
  },
  {
    step: "04",
    title: "Study Smarter",
    description: "Use AI chat for doubts and get personalized study plans",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">StudySpark</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button data-testid="button-get-started">
                  Get Started
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-3/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Powered by AI</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Your Personal
              <span className="text-primary"> AI Study Partner</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transform your study experience. Upload notes, get smart summaries,
              create flashcards, generate practice questions, and plan your studies
              with the power of AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto" data-testid="button-hero-start">
                  Start Learning Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-hero-demo">
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground mt-1">Students</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary">50K+</div>
                <div className="text-sm text-muted-foreground mt-1">Notes Analyzed</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary">100K+</div>
                <div className="text-sm text-muted-foreground mt-1">Flashcards Created</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary">4.9</div>
                <div className="text-sm text-muted-foreground mt-1">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Studying Shouldn't Be This Hard
              </h2>
              <div className="space-y-4">
                {[
                  "Spending hours reading through lengthy notes",
                  "Struggling to create effective summaries",
                  "Not knowing what to focus on for exams",
                  "Forgetting concepts you just studied",
                  "Managing multiple subjects at once",
                ].map((problem, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center mt-0.5">
                      <span className="text-destructive text-xs font-bold">!</span>
                    </div>
                    <p className="text-muted-foreground">{problem}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">StudySpark AI</div>
                    <div className="text-sm text-muted-foreground">Your solution</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    "AI-powered smart summaries in seconds",
                    "Automatic flashcard generation",
                    "Practice questions tailored to you",
                    "24/7 AI tutor for all your doubts",
                    "Personalized study schedules",
                  ].map((solution, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-chart-2 flex-shrink-0" />
                      <p className="text-sm">{solution}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete AI-powered learning platform that combines the best study tools in one place.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate transition-all duration-200">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes. No complex setup required.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-primary/10 mb-4">{item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full">
                    <div className="w-full h-0.5 bg-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl bg-primary overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-chart-3 opacity-90" />
            <div className="relative px-8 py-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to Study Smarter?
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Join thousands of students who are already transforming their study experience with AI.
              </p>
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90" data-testid="button-cta-start">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">StudySpark</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Created by Bhanu Teja
            </p>
          </div>
        </div>
      </footer >
    </div >
  );
}
