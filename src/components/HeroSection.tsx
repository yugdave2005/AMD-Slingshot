
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import DailyMoodCheck from "./DailyMoodCheck";

interface HeroSectionProps {
  onStartJourney: () => void;
  onMeditate: () => void;
}

const HeroSection = ({ onStartJourney, onMeditate }: HeroSectionProps) => {
  return (
    <section className="min-h-screen flex items-center justify-center pt-20 pb-10 px-6 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="container mx-auto text-center relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Your Mind, Visualized</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 text-foreground">
            Weave Your Thoughts Into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Digital Tapestry</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Transform your journaling into an interactive mind graph.
            Gain clarity, track emotions, and find your balance with AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="rounded-full px-8 text-lg h-12 w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
              onClick={onStartJourney}
            >
              Start Journaling <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 text-lg h-12 w-full sm:w-auto bg-white/50 hover:bg-white/80"
              onClick={onMeditate}
            >
              Meditate Now
            </Button>
          </div>

          <DailyMoodCheck />
        </motion.div>

        {/* Placeholder for a hero image or visualization preview */}
      </div>
    </section>
  );
};

export default HeroSection;