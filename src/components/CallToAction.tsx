import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles, Users, Clock } from "lucide-react";
import { useState } from "react";

interface CallToActionProps {
  onGetStarted?: () => void;
}

const CallToAction = ({ onGetStarted }: CallToActionProps) => {
  const [email, setEmail] = useState("");

  return (
    <section className="py-20 px-6 bg-gradient-neural">
      <div className="max-w-4xl mx-auto">
        <Card className="card-neural p-12 text-center relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-accent/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-glow">
              <Sparkles className="w-4 h-4" />
              Join the Beta Program
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Ready to Meet Your
                <br />
                <span className="gradient-text">Digital Twin?</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Be among the first to experience the future of mental wellness. 
                Join our private beta and start weaving your mind's tapestry today.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">500+</span>
                </div>
                <p className="text-sm text-muted-foreground">Beta testers</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  <span className="text-2xl font-bold">2 min</span>
                </div>
                <p className="text-sm text-muted-foreground">Average setup time</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-glow" />
                  <span className="text-2xl font-bold">98%</span>
                </div>
                <p className="text-sm text-muted-foreground">Satisfaction rate</p>
              </div>
            </div>

            {/* Email Signup */}
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email for early access"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-card/50 border-border/50 backdrop-blur-sm"
                />
                <Button variant="neural" size="lg">
                  Get Access
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                No spam, ever. Unsubscribe anytime. Your email is safe with us.
              </p>
            </div>

            {/* Additional CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button variant="glass" size="lg" onClick={onGetStarted}>
                Start Journaling Now
              </Button>
              <Button variant="ghost" size="lg" className="text-primary">
                Read the Research
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default CallToAction;