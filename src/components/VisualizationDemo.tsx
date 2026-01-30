import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  connections: string[];
}

const demoNodes: Node[] = [
  { id: "work", label: "Work Stress", x: 30, y: 20, size: 12, color: "bg-destructive", connections: ["anxiety", "sleep"] },
  { id: "anxiety", label: "Anxiety", x: 60, y: 35, size: 10, color: "bg-accent", connections: ["work", "sleep", "relationships"] },
  { id: "creativity", label: "Creativity", x: 20, y: 60, size: 8, color: "bg-primary", connections: ["music", "nature"] },
  { id: "relationships", label: "Relationships", x: 70, y: 65, size: 9, color: "bg-primary-glow", connections: ["anxiety", "gratitude"] },
  { id: "sleep", label: "Sleep Quality", x: 45, y: 10, size: 7, color: "bg-muted", connections: ["work", "anxiety"] },
  { id: "music", label: "Music", x: 10, y: 85, size: 6, color: "bg-primary", connections: ["creativity", "gratitude"] },
  { id: "nature", label: "Nature", x: 35, y: 80, size: 8, color: "bg-primary-glow", connections: ["creativity", "gratitude"] },
  { id: "gratitude", label: "Gratitude", x: 80, y: 85, size: 7, color: "bg-primary", connections: ["relationships", "music", "nature"] }
];

const VisualizationDemo = () => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isAnimating) {
        const randomNode = demoNodes[Math.floor(Math.random() * demoNodes.length)];
        setSelectedNode(randomNode.id);
        setTimeout(() => setSelectedNode(null), 1500);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAnimating]);

  return (
    <section className="py-20 px-6 bg-gradient-secondary">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            See Your Mind
            <span className="gradient-text"> in Real Time</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Watch how your thoughts, emotions, and experiences interconnect in a living, breathing visualization of your mental landscape.
          </p>
        </div>

        {/* Demo Visualization */}
        <Card className="card-neural p-8 max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">Your Mental Weave</h3>
              <Button
                variant="glass"
                size="sm"
                onClick={() => setIsAnimating(!isAnimating)}
                className="flex items-center gap-2"
              >
                {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isAnimating ? "Pause" : "Play"} Animation
              </Button>
            </div>

            {/* Visualization Container */}
            <div className="relative h-96 bg-gradient-to-br from-card/30 to-muted/20 rounded-lg border border-border/50 overflow-hidden">
              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                {demoNodes.map(node => 
                  node.connections.map(connectionId => {
                    const connectedNode = demoNodes.find(n => n.id === connectionId);
                    if (!connectedNode) return null;
                    
                    const isActive = selectedNode === node.id || selectedNode === connectionId;
                    
                    return (
                      <line
                        key={`${node.id}-${connectionId}`}
                        x1={`${node.x}%`}
                        y1={`${node.y}%`}
                        x2={`${connectedNode.x}%`}
                        y2={`${connectedNode.y}%`}
                        stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--border))"}
                        strokeWidth={isActive ? "2" : "1"}
                        opacity={isActive ? "0.8" : "0.3"}
                        className="transition-all duration-500"
                      />
                    );
                  })
                )}
              </svg>

              {/* Nodes */}
              {demoNodes.map(node => {
                const isSelected = selectedNode === node.id;
                const isConnected = selectedNode && demoNodes.find(n => n.id === selectedNode)?.connections.includes(node.id);
                
                return (
                  <div
                    key={node.id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 ${
                      isSelected ? 'scale-150 z-20' : isConnected ? 'scale-125 z-10' : 'scale-100 z-0'
                    }`}
                    style={{ 
                      left: `${node.x}%`, 
                      top: `${node.y}%`,
                    }}
                    onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  >
                    <div 
                      className={`w-${node.size} h-${node.size} ${node.color} rounded-full flex items-center justify-center ${
                        isSelected ? 'shadow-glow' : 'shadow-sm'
                      } ${isSelected || isConnected ? 'neural-pulse' : ''}`}
                    >
                      <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                    </div>
                    
                    {/* Label */}
                    <div className={`absolute top-full mt-2 left-1/2 transform -translate-x-1/2 transition-opacity duration-300 ${
                      isSelected || isConnected ? 'opacity-100' : 'opacity-60'
                    }`}>
                      <div className="bg-card/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium whitespace-nowrap border border-border/50">
                        {node.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-destructive rounded-full"></div>
                <span className="text-muted-foreground">Stress Patterns</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">Positive States</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent rounded-full"></div>
                <span className="text-muted-foreground">Emotional Patterns</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary-glow rounded-full"></div>
                <span className="text-muted-foreground">Growth Areas</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Feature Callouts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-gradient-primary rounded-full mx-auto flex items-center justify-center shadow-glow">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <h4 className="font-semibold">Dynamic Connections</h4>
            <p className="text-sm text-muted-foreground">Watch how your thoughts and emotions interconnect in real-time</p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-gradient-primary rounded-full mx-auto flex items-center justify-center shadow-glow">
              <div className="w-3 h-3 bg-white rounded-full neural-pulse"></div>
            </div>
            <h4 className="font-semibold">Pattern Recognition</h4>
            <p className="text-sm text-muted-foreground">AI identifies recurring patterns and emotional triggers</p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-gradient-primary rounded-full mx-auto flex items-center justify-center shadow-glow">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full ml-1"></div>
            </div>
            <h4 className="font-semibold">Interactive Exploration</h4>
            <p className="text-sm text-muted-foreground">Click and explore your mental landscape in 2D or 3D</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisualizationDemo;