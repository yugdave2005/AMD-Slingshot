import { motion, AnimatePresence } from 'framer-motion';
import { useJourney } from '@/context/JourneyContext';
import { useEffect, useState } from 'react';
import ThePortal from './ThePortal';
import StreamOfConsciousness from './StreamOfConsciousness';
import DeepDive from './DeepDive';

const JourneyContainer = () => {
    const { state } = useJourney();
    const [bgStyle, setBgStyle] = useState({});

    // Dynamic Background Logic based on Mood/Mode
    useEffect(() => {
        let colors = ['#0f172a', '#1e1b4b']; // Default Deep Space

        if (state.mood === 'anxious') {
            colors = ['#2e1065', '#4c1d95']; // Turbulent Purple
        } else if (state.mood === 'peaceful') {
            colors = ['#0f766e', '#134e4a']; // Deep Teal
        } else if (state.mood === 'happy') {
            colors = ['#be185d', '#831843']; // Warm Pink
        }

        setBgStyle({
            background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
            transition: 'background 2s ease-in-out'
        });
    }, [state.mood, state.mode]);

    return (
        <div
            className="relative w-screen h-screen overflow-hidden text-foreground flex flex-col"
            style={bgStyle}
        >
            {/* Ambient Layers */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-aurora-1 rounded-full blur-[120px] animate-aurora mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-aurora-2 rounded-full blur-[100px] animate-float mix-blend-screen" style={{ animationDelay: '2s' }} />
            </div>

            {/* Main Content Area with Morphing Transitions */}
            <main className="relative z-10 flex-grow flex items-center justify-center p-6">
                <AnimatePresence mode="wait">
                    {state.mode === 'PORTAL' && (
                        <motion.div
                            key="portal"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full max-w-4xl"
                        >
                            <ThePortal />
                        </motion.div>
                    )}

                    {state.mode === 'JOURNAL' && (
                        <motion.div
                            key="journal"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.6 }}
                            className="w-full h-full"
                        >
                            <StreamOfConsciousness />
                        </motion.div>
                    )}

                    {state.mode === 'MEDITATION' && (
                        <motion.div
                            key="meditation"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                            className="w-full h-full"
                        >
                            <DeepDive />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default JourneyContainer;
