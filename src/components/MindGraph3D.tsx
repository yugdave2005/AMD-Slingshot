import { useRef, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import { ThoughtNode, ThoughtEntry } from './ThoughtAnalyzer';
import { Button } from "@/components/ui/button";
import { X, Minimize2, RotateCcw } from "lucide-react";
import * as THREE from 'three';

interface MindGraph3DProps {
    nodes: ThoughtNode[];
    entries: ThoughtEntry[];
    onClose: () => void;
}

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

const MindGraph3D = ({ nodes, entries, onClose }: MindGraph3DProps) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const graphRef = useRef<any>();
    const [loading, setLoading] = useState(true);

    // Prepare graph data
    const graphData = {
        nodes: nodes.map(n => ({ ...n, color: tailwindClassToHex(n.color) })),
        links: [] as any[]
    };

    // Generate Hub-and-Spoke links (same logic as 2D)
    const linkSet = new Set<string>();
    entries.forEach(entry => {
        const entryNodes = nodes.filter(n => entry.nodes.includes(n.id));
        const hubs = entryNodes.filter(n => n.category === 'emotion' || n.category === 'trigger');
        const spokes = entryNodes.filter(n => n.category !== 'emotion' && n.category !== 'trigger');

        hubs.forEach(hub => {
            spokes.forEach(spoke => {
                const linkKey = [hub.id, spoke.id].sort().join('-');
                if (!linkSet.has(linkKey)) {
                    graphData.links.push({ source: hub.id, target: spoke.id });
                    linkSet.add(linkKey);
                }
            });
        });
    });

    useEffect(() => {
        // Simulate loading for smooth transition
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 animate-in fade-in duration-500">
            {/* Controls Overlay */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                <Button variant="outline" size="icon" onClick={() => {
                    graphRef.current?.zoomToFit(1000);
                }} className="bg-background/20 backdrop-blur-md border-white/20 hover:bg-white/20 text-white">
                    <RotateCcw className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={onClose} className="bg-background/20 backdrop-blur-md border-white/20 hover:bg-white/20 text-white">
                    <Minimize2 className="w-5 h-5" />
                </Button>
            </div>

            {/* Legend Overlay */}
            <div className="absolute bottom-8 left-8 z-50 p-4 rounded-xl bg-background/20 backdrop-blur-md border border-white/10 text-white/80 pointer-events-none">
                <h3 className="font-bold text-lg text-white mb-2">Immersive Mind Graph</h3>
                <p className="text-sm">Left click to rotate • Right click to pan • Scroll to zoom</p>
                <p className="text-xs mt-1 opacity-70">Experience your thoughts in a new dimension.</p>
            </div>

            {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                        <p className="text-white text-lg font-light tracking-widest animate-pulse">ENTERING IMMERSION...</p>
                    </div>
                </div>
            ) : (
                <ForceGraph3D
                    ref={graphRef}
                    graphData={graphData}
                    nodeLabel="label"
                    nodeColor="color"
                    nodeVal={(node: any) => node.intensity}

                    // Visuals
                    backgroundColor="#000000"
                    showNavInfo={false}

                    // Node Styling
                    nodeThreeObject={(node: any) => {
                        const group = new THREE.Group();

                        // Sphere
                        const geometry = new THREE.SphereGeometry(Math.max(2, node.intensity / 2));
                        const material = new THREE.MeshLambertMaterial({
                            color: node.color,
                            transparent: true,
                            opacity: 0.9,
                            emissive: node.color,
                            emissiveIntensity: 0.4
                        });
                        const sphere = new THREE.Mesh(geometry, material);
                        group.add(sphere);

                        // Text Label
                        const sprite = new SpriteText(node.label);
                        sprite.color = 'white';
                        sprite.textHeight = 3 + (node.intensity / 4);
                        sprite.position.set(0, (node.intensity / 2) + 4, 0); // Position above sphere
                        sprite.fontFace = 'Inter';
                        group.add(sprite);

                        return group;
                    }}

                    // Link Styling
                    linkWidth={0.5}
                    linkOpacity={0.3}
                    linkColor={() => "#ffffff"}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleWidth={1}
                    linkDirectionalParticleSpeed={0.005}

                    // Config
                    layoutAnimation={true}
                    cooldownTicks={100}
                    onEngineStop={() => graphRef.current?.zoomToFit(1000)}
                />
            )}
        </div>
    );
};

export default MindGraph3D;
