import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeatureCards from "@/components/FeatureCards";
import AboutSection from "@/components/AboutSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import JournalInterface from "@/components/JournalInterface";
import MeditationSpace from "@/components/MeditationSpace";
import MoodDashboard from "@/components/MoodDashboard";
import TherapistConnect from "@/components/TherapistConnect";

const Index = () => {
  const [currentView, setCurrentView] = useState<"landing" | "journal" | "meditation" | "mood-history" | "therapist-connect">("landing");
  const navigate = useNavigate();

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  // Listen for navigation events from children
  useEffect(() => {
    const handleNavigation = () => setCurrentView("mood-history");
    window.addEventListener("navigate-to-mood-dashboard", handleNavigation);
    return () => window.removeEventListener("navigate-to-mood-dashboard", handleNavigation);
  }, []);

  const goBackToLanding = () => setCurrentView("landing");

  if (currentView === "journal") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-6 pb-20"> {/* pt-24 to account for fixed navbar */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBackToLanding}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Journal & Mind Graph
            </h1>
            <p className="text-muted-foreground">Visualize your thoughts and connect the dots.</p>
          </div>
          <JournalInterface />
        </div>
      </div>
    );
  }

  if (currentView === "meditation") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-6 pb-20">
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBackToLanding}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-green-500">
              Meditation Space
            </h1>
            <p className="text-muted-foreground">Find clarity and calm in the chaos.</p>
          </div>
          <MeditationSpace />
        </div>
      </div>
    );
  }

  if (currentView === "mood-history") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-6 pb-20">
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBackToLanding}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-orange-400">
              Mood Dashboard
            </h1>
            <p className="text-muted-foreground">Track your emotional journey over time.</p>
          </div>
          <MoodDashboard />
        </div>
      </div>
    );
  }

  if (currentView === "therapist-connect") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-6 pb-20">
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBackToLanding}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>
          <TherapistConnect />
        </div>
      </div>
    );
  }

  // Landing Page View
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar />
      <main>
        <HeroSection
          onStartJourney={() => setCurrentView("journal")}
          onMeditate={() => setCurrentView("meditation")}
        />
        <FeatureCards onNavigate={(view) => {
          if (view === "fitness") {
            navigate("/fitness");
          } else {
            setCurrentView(view as any);
          }
        }} />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
