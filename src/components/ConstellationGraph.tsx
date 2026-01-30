import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useJourney } from "@/context/JourneyContext";
import { ThoughtNode } from "./ThoughtAnalyzer";

// Helper for colors
const getColor = (category: string) => {
    switch (category) {
        case 'emotion': return '#818cf8'; // Indigo
        case 'trigger': return '#ef4444'; // Red
        case 'person': return '#34d399'; // Emerald
        case 'activity': return '#fbbf24'; // Amber
        default: return '#ffffff';
    }
};

const ConstellationGraph = () => {
    const { state } = useJourney();
    const { nodes, entries } = state;
    const svgRef = useRef<SVGSVGElement>(null);

    // Refs for D3
    const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined>>();

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        const width = window.innerWidth;
        const height = window.innerHeight;

        svg.attr("viewBox", [0, 0, width, height]);
        svg.selectAll("*").remove(); // Clean

        const g = svg.append("g");
        const linkGroup = g.append("g").attr("class", "links");
        const nodeGroup = g.append("g").attr("class", "nodes");

        const simulation = d3.forceSimulation()
            .force("charge", d3.forceManyBody().strength(-100))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius(30));

        simulationRef.current = simulation;

        // Zoom support
        const zoom = d3.zoom<SVGSVGElement>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => g.attr("transform", event.transform));
        svg.call(zoom);

    }, []);

    useEffect(() => {
        if (!svgRef.current || !simulationRef.current) return;
        const svg = d3.select(svgRef.current);
        const linkGroup = svg.select(".links");
        const nodeGroup = svg.select(".nodes");

        const simNodes = nodes.map(d => ({ ...d }));

        // Generate Links based on shared entries (simple logic)
        const simLinks: any[] = [];
        nodes.forEach((source, i) => {
            nodes.forEach((target, j) => {
                if (i < j) {
                    const shared = source.entries.filter(e => target.entries.includes(e));
                    if (shared.length > 0) {
                        simLinks.push({ source: source.id, target: target.id, weight: shared.length });
                    }
                }
            });
        });

        simulationRef.current.nodes(simNodes);
        simulationRef.current.force("link", d3.forceLink(simLinks).id((d: any) => d.id).distance(150));

        // Draw Lines
        linkGroup.selectAll("line")
            .data(simLinks)
            .join("line")
            .attr("stroke", "rgba(255,255,255,0.1)")
            .attr("stroke-width", 1);

        // Draw Nodes (Stars)
        const nodeElements = nodeGroup.selectAll("g")
            .data(simNodes, (d: any) => d.id)
            .join(enter => {
                const g = enter.append("g").attr("class", "star-node");

                // Core Star
                g.append("circle")
                    .attr("r", (d: any) => 3 + (d.intensity * 0.5))
                    .attr("fill", "white")
                    .attr("filter", "url(#glow)"); // Assume we add a filter later or use shadow

                // Glow Ring
                g.append("circle")
                    .attr("r", (d: any) => 6 + (d.intensity * 0.8))
                    .attr("fill", (d: any) => getColor(d.category))
                    .attr("opacity", 0.3)
                    .attr("class", "pulse-ring");

                // Label
                g.append("text")
                    .text((d: any) => d.label)
                    .attr("dy", 20)
                    .attr("text-anchor", "middle")
                    .attr("fill", "white")
                    .attr("font-size", "10px")
                    .attr("opacity", 0.6)
                    .style("font-family", "sans-serif")
                    .style("pointer-events", "none");

                return g;
            });

        simulationRef.current.on("tick", () => {
            nodeElements.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
            linkGroup.selectAll("line")
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);
        });

        simulationRef.current.alpha(1).restart();

    }, [nodes, entries]); // Re-run when data changes

    return (
        <div className="absolute inset-0 pointer-events-none z-0">
            <svg ref={svgRef} className="w-full h-full opacity-60 mix-blend-screen" style={{ pointerEvents: 'all' }}>
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
            </svg>
        </div>
    );
};

export default ConstellationGraph;
