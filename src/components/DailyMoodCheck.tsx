import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Frown, Meh, ThumbsUp, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { logMoodCheckIn, fetchMoodHistory } from "@/lib/db";
import { toast } from "sonner";

const moods = [
    { label: "Great", icon: <Heart className="w-6 h-6 text-pink-500" />, value: "great", color: "bg-pink-100 border-pink-200" },
    { label: "Good", icon: <ThumbsUp className="w-6 h-6 text-green-500" />, value: "good", color: "bg-green-100 border-green-200" },
    { label: "Okay", icon: <Smile className="w-6 h-6 text-yellow-500" />, value: "okay", color: "bg-yellow-100 border-yellow-200" },
    { label: "Meh", icon: <Meh className="w-6 h-6 text-gray-500" />, value: "meh", color: "bg-gray-100 border-gray-200" },
    { label: "Bad", icon: <Frown className="w-6 h-6 text-blue-500" />, value: "bad", color: "bg-blue-100 border-blue-200" },
];


// Helper to get consistent today string
const getTodayString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const DailyMoodCheck = () => {
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [hasCheckedIn, setHasCheckedIn] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const today = getTodayString();

    useEffect(() => {
        const checkStatus = async () => {
            // Fast Path: Check Local Storage first for immediate UI feedback
            const localLastCheckIn = localStorage.getItem('lastMoodCheckInDate');
            const localSavedMood = localStorage.getItem('lastMood');

            if (localLastCheckIn === today && localSavedMood) {
                setHasCheckedIn(true);
                setSelectedMood(localSavedMood);
            }

            // Sync Path: Fetch from DB if user and update/correct if needed
            if (user) {
                try {
                    const history = await fetchMoodHistory(user.uid);
                    if (history) {
                        const todayEntry = history.find((e: any) => e.date === today);
                        if (todayEntry) {
                            setSelectedMood(todayEntry.mood);
                            setHasCheckedIn(true); // Ensure checked in if DB has it

                            // Sync local storage if missing
                            if (localLastCheckIn !== today) {
                                localStorage.setItem('lastMoodCheckInDate', today);
                                localStorage.setItem('lastMood', todayEntry.mood);
                            }
                        }
                    }
                } catch (e) {
                    console.error("Background sync failed:", e);
                }
            }
        };
        checkStatus();
    }, [user, today]);

    const handleSelectMood = async (moodValue: string) => {
        if (isSubmitting) return;

        // 1. Optimistic Update: Update UI Immediately
        setIsSubmitting(true); // Briefly show spinner or just transition
        setSelectedMood(moodValue);

        // 2. Update Local State & Storage (Instant Persistence)
        localStorage.setItem('lastMoodCheckInDate', today);
        localStorage.setItem('lastMood', moodValue);

        // Update local history array for Dashboard fallback
        const history = JSON.parse(localStorage.getItem('moodHistory') || '[]');
        const newHistory = history.filter((entry: any) => entry.date !== today);
        newHistory.push({ date: today, mood: moodValue });
        localStorage.setItem('moodHistory', JSON.stringify(newHistory));

        // 3. Perform Cloud Sync in Background
        if (user) {
            try {
                // We await this just to handle errors, but UI moves on
                await logMoodCheckIn(user.uid, moodValue, today);
                toast.success("Mood updated!");
            } catch (error) {
                console.error("Cloud save failed:", error);
                toast.error("Saved locally. Will sync when online.");
                // We do NOT revert UI state because local save succeeded. 
                // The user is "checked in" locally.
            }
        } else {
            setHasCheckedIn(true);
        }

        setIsSubmitting(false);
        setHasCheckedIn(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="w-full max-w-2xl mx-auto mt-24"
        >
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50 shadow-md">
                <div className="text-center mb-4 ">
                    <h3 className="text-xl font-semibold text-center text-foreground">How are you feeling today?</h3>
                    <p className="text-muted-foreground text-center text-sm">Check in with yourself. Tracking your mood helps identify patterns.</p>
                </div>

                <AnimatePresence mode="wait">
                    {!hasCheckedIn ? (
                        <motion.div
                            key="selection"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-wrap justify-center gap-4 mt-2"
                        >
                            {moods.map((mood) => (
                                <button
                                    key={mood.value}
                                    onClick={() => handleSelectMood(mood.value)}
                                    disabled={isSubmitting}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border border-transparent 
                                    transition-all duration-200 w-24 h-24 ${mood.color} 
                                    ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-md hover:bg-opacity-100'} 
                                    bg-opacity-50`}
                                >
                                    <div className="mb-2 bg-background rounded-full p-2 shadow-sm">
                                        {isSubmitting && selectedMood === mood.value ? (
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            mood.icon
                                        )}
                                    </div>
                                    <span className="text-xs font-medium text-foreground">{mood.label}</span>
                                </button>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="feedback"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-4"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-bounce">
                                {moods.find(m => m.value === selectedMood)?.icon}
                            </div>
                            <h4 className="text-lg font-medium text-primary">Thanks for checking in!</h4>
                            <p className="text-muted-foreground"> Your mood has been recorded.</p>
                            <div className="flex justify-center gap-4 mt-4">
                                <button
                                    onClick={() => setHasCheckedIn(false)}
                                    className="text-xs text-muted-foreground underline hover:text-primary"
                                >
                                    Change selection
                                </button>
                                <span className="text-muted-foreground text-xs">•</span>
                                <button
                                    // This event will be caught by the parent or handled via custom event/context if needed. 
                                    // For simplicity in this stack, we'll dispatch a custom event.
                                    onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-mood-dashboard'))}
                                    className="text-xs font-semibold text-primary hover:underline"
                                >
                                    View Mood History
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
    );
};

export default DailyMoodCheck;
