import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Eye, UserCheck } from "lucide-react";

const privacyFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "Your mental model and all personal data are encrypted both in transit and at rest. Only you have the keys."
  },
  {
    icon: Shield,
    title: "Privacy by Design", 
    description: "We built WellWeave from the ground up with privacy as the foundation, not an afterthought."
  },
  {
    icon: Eye,
    title: "Complete Transparency",
    description: "See exactly what data we collect, how it's used, and have full control over your information."
  },
  {
    icon: UserCheck,
    title: "Your Data, Your Choice",
    description: "Delete, export, or modify your data anytime. No lock-in, no hidden clauses."
  }
];

const PrivacySection = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-card/20 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Privacy First</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold">
            Your Mind is
            <span className="gradient-text"> Sacred Territory</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We understand that mental health data is the most sensitive information you can share. 
            That's why we've built the strongest privacy protections in the industry.
          </p>
        </div>

        {/* Privacy Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {privacyFeatures.map((feature, index) => (
            <Card key={index} className="card-neural p-6 hover:scale-105 transition-neural">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Privacy Promise */}
        <Card className="card-neural p-8 text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto flex items-center justify-center shadow-glow">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold">Our Privacy Promise</h3>
            <div className="max-w-3xl mx-auto space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                <strong className="text-foreground">We will never sell your data.</strong> Your mental health journey is yours alone. 
                We generate revenue through subscriptions, not by monetizing your personal information.
              </p>
              <p className="leading-relaxed">
                All AI processing happens with zero-knowledge encryption, meaning even we cannot access your raw data. 
                Your digital twin exists only for you, protected by military-grade security.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="neural" size="lg">
                Read Our Privacy Policy
              </Button>
              <Button variant="glass" size="lg">
                Security Whitepaper
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default PrivacySection;