import { useState } from 'react';
import { useJourney } from '@/context/JourneyContext';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ThePortal = () => {
    const { setMode, setMood } = useJourney();
    const [input, setInput] = useState('');

    const handleEntry = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Simple analysis placeholder (real logic would go here)
        const lowerInput = input.toLowerCase();
        if (lowerInput.includes('anx') || lowerInput.includes('stress') || lowerInput.includes('worry')) {
            setMood('anxious', 0.8);
        } else if (lowerInput.includes('happy') || lowerInput.includes('good') || lowerInput.includes('great')) {
            setMood('happy', 0.6);
        } else {
            setMood('neutral', 0.3);
        }

        setMode('JOURNAL');
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-12 text-center">
            {/* The Breathing Orb */}
            <motion.div
                className="relative w-64 h-64 md:w-96 md:h-96"
                animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.8, 1, 0.8],
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/30 to-accent/30 blur-3xl animate-pulse" />
                <div className="absolute inset-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-3xl shadow-[0_0_50px_rgba(255,255,255,0.1)] flex items-center justify-center">
                    <div className="w-1/2 h-1/2 rounded-full bg-white/10 blur-xl" />
                </div>
            </motion.div>

            <div className="space-y-6 max-w-lg z-10">
                <h1 className="text-4xl md:text-6xl font-extralight tracking-tight text-white drop-shadow-lg">
                    Weave Your Peace
                </h1>

                <form onSubmit={handleEntry} className="relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="How are you feeling right now?"
                        className="w-full bg-transparent border-b border-white/30 py-4 text-2xl md:text-3xl font-light text-center placeholder:text-white/30 focus:outline-none focus:border-white/80 transition-all"
                        autoFocus
                    />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                        <Button
                            type="submit"
                            size="icon"
                            variant="ghost"
                            className="hover:bg-white/10 text-white rounded-full"
                        >
                            <ArrowRight className="w-6 h-6" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ThePortal;
