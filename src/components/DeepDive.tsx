import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useJourney } from '@/context/JourneyContext';
import { motion, AnimatePresence } from 'framer-motion';

const DeepDive = () => {
    const { setMode } = useJourney();
    const [timeLeft, setTimeLeft] = useState(60); // 1 minute default
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-12">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white/80 space-y-2"
            >
                <h2 className="text-4xl font-light tracking-wide">Deep Breathe</h2>
                <p className="text-xl font-light opacity-60">
                    {isActive ? "Focus on your breath..." : "Ready to dive in?"}
                </p>
            </motion.div>

            {/* Breathing Animation */}
            <div className="relative flex items-center justify-center">
                <motion.div
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{
                        duration: 8, // 4s inhale, 4s exhale
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="w-64 h-64 rounded-full bg-primary/20 blur-3xl absolute"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="w-48 h-48 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-sm bg-white/5"
                >
                    <span className="text-4xl font-thin tabular-nums font-mono text-white/80">
                        {formatTime(timeLeft)}
                    </span>
                </motion.div>
            </div>

            <div className="flex gap-4">
                <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 rounded-full px-8"
                    onClick={() => setIsActive(!isActive)}
                >
                    {isActive ? "Pause" : timeLeft === 0 ? "Restart" : "Start"}
                </Button>

                <Button
                    variant="ghost"
                    className="text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                    onClick={() => setMode('PORTAL')}
                >
                    Return
                </Button>
            </div>
        </div>
    );
};

export default DeepDive;
