import { useEffect, useState } from "react";
import { Award, Lock, Star, Zap, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { fetchAchievements, unlockAchievement } from "@/lib/db";
import { fetchMeditationStats } from "@/lib/db";

// Define the Achievement type locally or import if centralized
type Achievement = {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    condition: (stats: any) => boolean;
};

const Achievements = () => {
    const { user } = useAuth();
    const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
    const [stats, setStats] = useState<any>({ streak: 0 });

    const predefinedAchievements: Achievement[] = [
        {
            id: "first_step",
            title: "First Step",
            description: "Complete your first meditation session.",
            icon: <Star className="w-6 h-6 text-yellow-500" />,
            condition: (s) => s.streak >= 1 // Simplified logic for demo
        },
        {
            id: "streak_3",
            title: "Consistency is Key",
            description: "Reach a 3-day meditation streak.",
            icon: <Zap className="w-6 h-6 text-orange-500" />,
            condition: (s) => s.streak >= 3
        },
        {
            id: "streak_7",
            title: "Week Warrior",
            description: "Reach a 7-day meditation streak.",
            icon: <Award className="w-6 h-6 text-purple-500" />,
            condition: (s) => s.streak >= 7
        },
        // Placeholder for future expansion
        {
            id: "journal_master",
            title: "Inner Voice",
            description: "Feature coming soon: Journal consistency.",
            icon: <BookOpen className="w-6 h-6 text-blue-500" />,
            condition: () => false
        }
    ];

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            // 1. Fetch unlocked from DB
            const dbAchievements = await fetchAchievements(user.uid);
            const dbIds = dbAchievements.map((a: any) => a.id);
            setUnlockedIds(dbIds);

            // 2. Fetch stats to check for new unlocks
            const meditationStats = await fetchMeditationStats(user.uid);
            setStats(meditationStats);

            // 3. Check and unlock new ones
            predefinedAchievements.forEach(async (achievement) => {
                const isAlreadyUnlocked = dbIds.includes(achievement.id);
                if (!isAlreadyUnlocked && achievement.condition(meditationStats)) {
                    // Unlock it!
                    await unlockAchievement(user.uid, achievement.id);
                    setUnlockedIds(prev => [...prev, achievement.id]);
                }
            });
        };

        loadData();
    }, [user]);

    return (
        <Card className="card-neural mt-6">
            <CardHeader>
                <CardTitle className="gradient-text text-xl flex items-center gap-2">
                    <Award className="w-5 h-5" /> Achievements
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {predefinedAchievements.map((achievement) => {
                        const isUnlocked = unlockedIds.includes(achievement.id);
                        return (
                            <div
                                key={achievement.id}
                                className={`p-4 rounded-lg border flex items-center gap-4 transition-all duration-300 ${isUnlocked
                                        ? "bg-secondary/30 border-primary/20"
                                        : "bg-muted/30 border-transparent opacity-60 grayscale"
                                    }`}
                            >
                                <div className={`p-2 rounded-full ${isUnlocked ? "bg-white/50" : "bg-muted"}`}>
                                    {isUnlocked ? achievement.icon : <Lock className="w-6 h-6 text-muted-foreground" />}
                                </div>
                                <div>
                                    <h4 className="font-semibold">{achievement.title}</h4>
                                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

export default Achievements;
