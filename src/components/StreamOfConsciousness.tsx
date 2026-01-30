import { useState } from 'react';
import { useJourney } from '@/context/JourneyContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import ConstellationGraph from './ConstellationGraph';
import { thoughtAnalyzer, ThoughtNode } from './ThoughtAnalyzer';
import { useToast } from "@/hooks/use-toast";

const StreamOfConsciousness = () => {
    const { setMode, addEntry, state } = useJourney();
    const [input, setInput] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { toast } = useToast();

    const handleSend = async () => {
        if (!input.trim()) return;
        setIsAnalyzing(true);

        try {
            const entryId = `entry-${Date.now()}`;
            // 1. Analyze
            const analysis = await thoughtAnalyzer.analyzeText(input, entryId);

            // 2. Update Global Context (which updates Graph)
            // Need to merge logic here or in Context. 
            // Analyzer returns "nodes" (new or updated). 
            // We need to merge them with existing nodes to preserve consistency if IDs match.
            const mergedNodes = thoughtAnalyzer.mergeNodes(state.nodes, analysis.nodes);

            addEntry(analysis.entry, mergedNodes);

            setInput("");
            toast({
                title: "Thoughts Woven",
                description: `Added ${analysis.nodes.length} stars to your sky.`,
            });

        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Could not weave thought.", variant: "destructive" });
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-end pb-12 overflow-hidden">
            {/* Background: The Mind Constellation */}
            <div className="absolute inset-0">
                <ConstellationGraph />
            </div>

            {/* Foreground: Input Interface */}
            <div className="relative z-10 w-full max-w-2xl px-6">
                {/* Floating Chat/Journal Bubbles could go here */}

                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass-panel rounded-3xl p-2 flex items-center gap-2"
                >
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Stream your consciousness..."
                        className="flex-1 bg-transparent border-none text-lg px-6 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-0"
                        disabled={isAnalyzing}
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={isAnalyzing || !input.trim()}
                        className="rounded-full h-12 w-12 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10"
                    >
                        {isAnalyzing ? <Sparkles className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                </motion.div>

                <div className="flex justify-center gap-4 mt-6">
                    <Button variant="ghost" className="text-white/50 hover:text-white hover:bg-white/5" onClick={() => setMode('MEDITATION')}>
                        Dive Deeper
                    </Button>
                    <Button variant="ghost" className="text-white/50 hover:text-white hover:bg-white/5" onClick={() => setMode('PORTAL')}>
                        Return to Portal
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StreamOfConsciousness;
