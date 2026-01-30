import { Card } from "@/components/ui/card";
import { Brain, Eye, Palette, Users } from "lucide-react";

const phases = [
  {
    number: "01",
    title: "Genesis Engine",
    subtitle: "Weaving the First Threads",
    description: "Begin your journey with voice and text journaling. Our AI analyzes your entries to create the initial neural map of your inner world.",
    icon: Brain,
    features: ["Voice & Text Journaling", "AI Pattern Recognition", "Initial Mind Map", "Privacy Controls"],
    gradient: "from-primary/20 to-primary-glow/20"
  },
  {
    number: "02", 
    title: "Interactive Mirror",
    subtitle: "Understanding the Pattern",
    description: "Explore your mental landscape in 2D/3D. The Guide asks powerful questions based on your data patterns and connects with biosensor data.",
    icon: Eye,
    features: ["3D Neural Exploration", "AI-Guided Reflection", "Biosensor Integration", "Pattern Discovery"],
    gradient: "from-accent/20 to-primary/20"
  },
  {
    number: "03",
    title: "Active Loom", 
    subtitle: "Reshaping Through Experience",
    description: "Transform insights into action through interactive narratives, gamified challenges, and generative art therapy.",
    icon: Palette,
    features: ["Interactive Stories", "Therapeutic Games", "Emotion Art", "Adaptive Music"],
    gradient: "from-primary-glow/20 to-accent/20"
  },
  {
    number: "04",
    title: "Shared Tapestry",
    subtitle: "From Inner World to Connection", 
    description: "Connect anonymously with others who share similar patterns. Co-create art, find mentorship, and build meaningful relationships.",
    icon: Users,
    features: ["Anonymous Matching", "Collaborative Art", "Peer Mentorship", "Real-World Activities"],
    gradient: "from-accent/20 to-primary/20"
  }
];

const PhaseOverview = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Four Phases of
            <span className="gradient-text"> Mental Evolution</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your journey from self-discovery to meaningful connection, guided by AI and powered by your own insights.
          </p>
        </div>
        
        {/* Phases Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {phases.map((phase, index) => (
            <Card 
              key={phase.number}
              className={`card-neural relative p-8 hover:scale-105 transition-neural cursor-pointer group ${
                index % 2 === 0 ? 'lg:translate-y-8' : ''
              }`}
            >
              {/* Phase Number */}
              <div className="absolute top-6 right-6 text-4xl font-bold text-muted-foreground/30">
                {phase.number}
              </div>
              
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${phase.gradient} opacity-50 rounded-lg`}></div>
              
              {/* Content */}
              <div className="relative z-10 space-y-6">
                {/* Icon */}
                <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow group-hover:shadow-accent-glow transition-all duration-300">
                  <phase.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                
                {/* Title */}
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">{phase.title}</h3>
                  <p className="text-primary font-medium">{phase.subtitle}</p>
                </div>
                
                {/* Description */}
                <p className="text-muted-foreground leading-relaxed">
                  {phase.description}
                </p>
                
                {/* Features */}
                <div className="grid grid-cols-2 gap-2">
                  {phase.features.map((feature, featureIndex) => (
                    <div 
                      key={featureIndex}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Connection Lines */}
              {index < phases.length - 1 && (
                <div className="hidden lg:block absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-px h-16 bg-gradient-to-b from-primary/50 to-transparent"></div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PhaseOverview;