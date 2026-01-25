import React from "react"
import Link from "next/link"
import { PlutoLogo } from "@/components/pluto-logo"
import { Button } from "@/components/ui/button"
import { Activity, Brain, Shield, MessageSquare, Zap, Heart } from "lucide-react"

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <PlutoLogo size="sm" />
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-foreground">
                  Log in
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
              AI-Powered Health Insights
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl text-balance">
              Your Intelligent Health
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Assistant
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
              Pluto analyzes your symptoms and health-related inputs using artificial intelligence 
              to generate preliminary assessments and structured insights. Get health awareness 
              support to aid your early decision-making.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/chat">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg">
                  Start Health Analysis
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-border hover:bg-muted bg-transparent">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No account required to get started
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Intelligent Health Analysis
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powered by advanced AI to provide comprehensive health insights
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Brain className="h-6 w-6" />}
              title="AI-Powered Analysis"
              description="Advanced language models analyze your symptoms to generate structured health insights and preliminary assessments."
            />
            <FeatureCard
              icon={<Activity className="h-6 w-6" />}
              title="Symptom Tracking"
              description="Describe your symptoms in natural language and receive detailed analysis with potential causes and recommendations."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Privacy First"
              description="Your health data is processed securely. We prioritize your privacy and never share your information."
            />
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title="Conversational Interface"
              description="Chat naturally with Pluto like you would with a health professional. Ask follow-up questions anytime."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Instant Insights"
              description="Get immediate health insights without waiting. Our AI processes your inputs in real-time."
            />
            <FeatureCard
              icon={<Heart className="h-6 w-6" />}
              title="Health Awareness"
              description="Improve your health awareness with educational insights and preventive care recommendations."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              How Pluto Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps to get health insights
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <StepCard
              number="01"
              title="Describe Your Symptoms"
              description="Tell Pluto about your symptoms, health concerns, or any questions you have about your wellbeing."
            />
            <StepCard
              number="02"
              title="AI Analysis"
              description="Our advanced AI processes your input, cross-referencing medical knowledge to generate insights."
            />
            <StepCard
              number="03"
              title="Get Recommendations"
              description="Receive structured health insights, potential causes, and recommendations for next steps."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Ready to Get Health Insights?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start your free health analysis with Pluto today. No registration required.
          </p>
          <Link href="/chat">
            <Button size="lg" className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 text-lg">
              Start Free Analysis
            </Button>
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 border-t border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Important Disclaimer:</strong> Pluto is designed for health awareness 
            and educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. 
            Always consult with a qualified healthcare provider for medical concerns.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <PlutoLogo size="sm" />
            <p className="text-sm text-muted-foreground">
              Pluto AI Health Assistant. For educational purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-card-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="relative p-6 text-center">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground text-2xl font-bold">
        {number}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
