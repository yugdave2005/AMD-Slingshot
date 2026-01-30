import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Maximize2, ZoomIn, ZoomOut, Download, Upload, CloudDownload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { uploadGraphImage } from "@/lib/storage";
import { toast } from "sonner";
import { ThoughtNode, ThoughtEntry } from "./ThoughtAnalyzer";
import { useJourney } from "@/context/JourneyContext";
import * as d3 from "d3";

interface MindGraphProps {
  nodes: ThoughtNode[];
  entries: ThoughtEntry[];
  onNodeClick?: (node: ThoughtNode) => void;
}

// Helper to convert Tailwind classes to SVG-compatible HEX codes
const tailwindClassToHex = (className: string = ''): string => {
  const colorMap: { [key: string]: string } = {
    'bg-destructive': '#ef4444',
    'bg-primary': '#8b5cf6',
    'bg-primary-glow': '#a78bfa',
    'bg-secondary': '#10b981',
    'bg-accent': '#3b82f6',
    'bg-muted': '#6b7280',
    'bg-trigger': '#f97316',
  };
  const baseClass = className.split('/')[0];
  return colorMap[className] || colorMap[baseClass] || '#9ca3af';
};

import MindGraph3D from "./MindGraph3D";

const MindGraph = ({ nodes, entries, onNodeClick }: MindGraphProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [show3D, setShow3D] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();

  // Use refs to hold D3 selections and simulation to prevent re-initialization
  const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined>>();
  const linkGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined>>();
  const nodeGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined>>();

  // One-time setup effect for SVG, groups, and simulation
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svg.node()!.clientWidth;
    const height = svg.node()!.clientHeight;

    const g = svg.append("g");
    linkGroupRef.current = g.append("g").attr("class", "links");
    nodeGroupRef.current = g.append("g").attr("class", "nodes");

    simulationRef.current = d3.forceSimulation()
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => Math.max(20, 10 + d.intensity) + 10));

    const zoom = d3.zoom<SVGSVGElement>()
      .scaleExtent([0.3, 5])
      .on("zoom", event => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

  }, []);

  // Effect to update graph when nodes/entries data changes
  useEffect(() => {
    if (!svgRef.current || !simulationRef.current || !linkGroupRef.current || !nodeGroupRef.current) return;

    setIsLoading(true); // Start loading when data updates

    const simNodes: (ThoughtNode & d3.SimulationNodeDatum)[] = nodes.map(d => ({ ...d }));

    // Correct Hub-and-Spoke Link Generation Logic
    const simLinks: d3.SimulationLinkDatum<d3.SimulationNodeDatum>[] = [];
    const linkSet = new Set<string>();

    entries.forEach(entry => {
      const entryNodes = nodes.filter(n => entry.nodes.includes(n.id));
      const hubs = entryNodes.filter(n => n.category === 'emotion' || n.category === 'trigger');
      const spokes = entryNodes.filter(n => n.category !== 'emotion' && n.category !== 'trigger');

      hubs.forEach(hub => {
        spokes.forEach(spoke => {
          const linkKey = [hub.id, spoke.id].sort().join('-');
          if (!linkSet.has(linkKey)) {
            simLinks.push({ source: hub.id, target: spoke.id });
            linkSet.add(linkKey);
          }
        });
      });
    });

    // Update simulation with new data
    simulationRef.current.nodes(simNodes);
    const linkForce = d3.forceLink(simLinks).id((d: any) => d.id).strength(0.1).distance(90);
    simulationRef.current.force("link", linkForce);

    // D3 Enter-Update-Exit pattern for nodes
    const nodeGroups = nodeGroupRef.current
      .selectAll("g.node-group")
      .data(simNodes, (d: any) => d.id)
      .join(
        enter => {
          const g = enter.append("g").attr("class", "node-group").style("opacity", 0);
          g.append("circle").style("transition", "transform 0.3s ease");
          g.append("text")
            .attr("text-anchor", "middle")
            .attr("class", "text-xs font-medium")
            .style("fill", "hsl(var(--foreground))")
            .style("pointer-events", "none")
            .style("transition", "opacity 0.3s ease");
          g.transition().duration(750).style("opacity", 1);
          return g;
        },
        update => update,
        exit => exit.transition().duration(500).style("opacity", 0).remove()
      );

    nodeGroups
      .select("circle")
      .attr("r", (d: any) => Math.max(10, Math.min(30, 10 + d.intensity)))
      .attr("fill", (d: any) => tailwindClassToHex(d.color));

    nodeGroups
      .select("text")
      .text((d: any) => d.label)
      .attr("dy", (d: any) => Math.max(12, Math.min(32, 12 + d.intensity)) + 8);

    nodeGroups
      .on("click", (event, d) => {
        setSelectedNode(prev => (prev === d.id ? null : d.id));
        onNodeClick?.(d as ThoughtNode);
      })
      .on("mouseover", (event, d) => setHoveredNode(d.id))
      .on("mouseout", () => setHoveredNode(null));

    // D3 Enter-Update-Exit pattern for links
    linkGroupRef.current
      .selectAll("line")
      .data(simLinks, (d: any) => `${d.source.id}-${d.target.id}`)
      .join("line")
      .style("transition", "stroke 0.3s, stroke-width 0.3s, opacity 0.3s");

    // Restart simulation
    simulationRef.current.alpha(1).restart();
    simulationRef.current.on("tick", () => {
      nodeGroups.attr("transform", d => `translate(${d.x}, ${d.y})`);
      linkGroupRef.current?.selectAll("line")
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);
    });

    // Simulate a short loading delay for the animation to be visible and smooth out rendering
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);

  }, [nodes, entries, onNodeClick]);

  // Effect for updating styles on selection/hover
  useEffect(() => {
    if (!linkGroupRef.current || !nodeGroupRef.current) return;

    const links = linkGroupRef.current.selectAll("line");
    const nodeGroups = nodeGroupRef.current.selectAll("g.node-group");

    links
      .attr("stroke", d => {
        const isActive = hoveredNode === (d as any).source.id || hoveredNode === (d as any).target.id || selectedNode === (d as any).source.id || selectedNode === (d as any).target.id;
        return isActive ? tailwindClassToHex('bg-primary') : "#a1a1aa";
      })
      .attr("stroke-width", d => {
        const isActive = hoveredNode === (d as any).source.id || hoveredNode === (d as any).target.id || selectedNode === (d as any).source.id || selectedNode === (d as any).target.id;
        return isActive ? 2 : 1;
      })
      .attr("opacity", d => {
        const isActive = hoveredNode === (d as any).source.id || hoveredNode === (d as any).target.id || selectedNode === (d as any).source.id || selectedNode === (d as any).target.id;
        return isActive ? 1.0 : 0.6;
      });

    const selectedConnections = new Set(nodes.find(n => n.id === selectedNode)?.connections);

    nodeGroups.select("circle")
      .attr("class", (d: any) => selectedNode === d.id ? 'shadow-glow neural-pulse' : 'shadow-sm')
      .attr("transform", (d: any) => {
        const isHovered = hoveredNode === d.id;
        const isConnected = selectedNode && selectedConnections.has(d.id);
        return (isHovered && selectedNode !== d.id) || isConnected ? "scale(1.25)" : "scale(1)";
      });

    nodeGroups.select("text")
      .style("opacity", (d: any) => {
        const isSelected = selectedNode === d.id;
        const isHovered = hoveredNode === d.id;
        const isConnected = selectedNode && selectedConnections.has(d.id);
        return (!selectedNode || isSelected || isHovered || isConnected) ? 1 : 0.4;
      });

  }, [selectedNode, hoveredNode, nodes]);

  const resetView = () => {
    setSelectedNode(null);
    setHoveredNode(null);
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition().duration(750)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };
  const zoomIn = () => svgRef.current && zoomRef.current && d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1.2);
  const zoomOut = () => svgRef.current && zoomRef.current && d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 0.8);

  const { user } = useAuth();

  const handleSaveSnapshot = async () => {
    if (!svgRef.current || !user) {
      if (!user) toast.error("Please sign in to save snapshots.");
      return;
    }

    try {
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgRef.current);

      if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      if (!source.match(/^<svg[^>]+xmlns:xlink="http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
      }

      source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
      const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

      // Convert to Blob
      const res = await fetch(url);
      const blob = await res.blob();

      toast.info("Uploading snapshot...");
      const downloadUrl = await uploadGraphImage(user.uid, blob);

      // Save the URL to visualizations collection
      const { saveGraphSnapshotUrl } = await import("@/lib/db");
      await saveGraphSnapshotUrl(user.uid, downloadUrl, `Snapshot_${new Date().toISOString()}`);

      console.log("Uploaded to:", downloadUrl);
      toast.success("Snapshot saved to your profile!");

    } catch (error) {
      console.error("Snapshot error:", error);
      toast.error("Failed to save snapshot.");
    }
  };

  const { saveJourney, loadJourney } = useJourney();

  const handleSaveData = async () => {
    if (!user) {
      toast.error("Please sign in to save.");
      return;
    }
    toast.promise(saveJourney(), {
      loading: 'Saving mind graph data...',
      success: 'Mind graph saved!',
      error: 'Failed to save data.'
    });
  };

  const handleLoadData = async () => {
    if (!user) {
      toast.error("Please sign in to load.");
      return;
    }
    toast.promise(loadJourney(), {
      loading: 'Loading mind graph...',
      success: 'Mind graph loaded!',
      error: 'Failed to load data.'
    });
  };

  // ... The rest of your JSX remains the same
  return (
    <>
      {show3D && (
        <MindGraph3D
          nodes={nodes}
          entries={entries}
          onClose={() => setShow3D(false)}
        />
      )}

      <Card className="card-neural p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Your Mind Weave</h3>
            <p className="text-sm text-muted-foreground">
              {nodes.length} concepts • {entries.length} entries
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={zoomIn} aria-label="Zoom In"><ZoomIn className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={zoomOut} aria-label="Zoom Out"><ZoomOut className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={resetView} aria-label="Reset View"><RotateCcw className="w-4 h-4" /></Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShow3D(true)}
              className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
              aria-label="Maximize 3D"
            >
              <Maximize2 className="w-4 h-4 mr-1" /> 3D
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadData}
              title="Load Saved Graph"
            >
              <CloudDownload className="w-4 h-4 text-blue-500" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveData}
              title="Save Grid Data"
            >
              <Upload className="w-4 h-4 text-green-500" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveSnapshot}
              title="Save Snapshot Image"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="relative h-96 bg-gradient-to-br from-card/30 to-muted/20 rounded-lg border border-border/50 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-sm transition-opacity duration-300">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <p className="text-sm font-medium text-primary animate-pulse">Weaving your thoughts...</p>
              </div>
            </div>
          )}
          <svg ref={svgRef} className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`} style={{ zIndex: 1 }} />
        </div>

        {selectedNode && (
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            {(() => {
              const node = nodes.find(n => n.id === selectedNode);
              if (!node) return null;
              const relatedEntries = entries.filter(entry => entry.nodes.includes(node.id));
              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tailwindClassToHex(node.color) }}>
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-semibold">{node.label}</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {node.category} • Intensity: {node.intensity}/15 • Appears in {node.entries.length} entries
                      </p>
                    </div>
                  </div>
                  {node.connections.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Connected to:</p>
                      <div className="flex flex-wrap gap-2">
                        {nodes.filter(n => node.connections.some(c => c.id === n.id)).map(connNode => (
                          <span key={connNode.id} className="text-xs px-2 py-1 bg-primary/10 rounded-full cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => setSelectedNode(connNode.id)}>
                            {connNode.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {relatedEntries.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Recent mentions:</p>
                      <div className="text-xs text-muted-foreground">"{relatedEntries[0].text.slice(0, 100)}..."</div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: tailwindClassToHex('bg-destructive') }}></div><span className="text-muted-foreground">Stress/Triggers</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: tailwindClassToHex('bg-primary') }}></div><span className="text-muted-foreground">Positive Emotions</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: tailwindClassToHex('bg-secondary') }}></div><span className="text-muted-foreground">People</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: tailwindClassToHex('bg-muted') }}></div><span className="text-muted-foreground">Activities</span></div>
        </div>
      </Card>
    </>
  );
};

export default MindGraph;
