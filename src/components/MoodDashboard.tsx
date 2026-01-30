
import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Smile, Frown, Meh, ThumbsUp, Heart, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { fetchMoodHistory } from "@/lib/db";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const moodMap = {
    great: 5,
    good: 4,
    okay: 3,
    meh: 2,
    bad: 1
};

const moodsInfo = {
    great: { label: "Great", icon: <Heart className="w-4 h-4 text-pink-500" />, color: "bg-pink-100" },
    good: { label: "Good", icon: <ThumbsUp className="w-4 h-4 text-green-500" />, color: "bg-green-100" },
    okay: { label: "Okay", icon: <Smile className="w-4 h-4 text-yellow-500" />, color: "bg-yellow-100" },
    meh: { label: "Meh", icon: <Meh className="w-4 h-4 text-gray-500" />, color: "bg-gray-100" },
    bad: { label: "Bad", icon: <Frown className="w-4 h-4 text-blue-500" />, color: "bg-blue-100" },
};

interface MoodEntry {
    date: string;
    mood: string;
}

const MoodDashboard = () => {
    const [history, setHistory] = useState<MoodEntry[]>([]);
    const [month, setMonth] = useState<Date>(new Date());
    const { user } = useAuth();

    useEffect(() => {
        const loadHistory = async () => {
            if (user) {
                const data = await fetchMoodHistory(user.uid);
                // Cast to MoodEntry if needed or ensure types match
                setHistory(data as MoodEntry[]);
            } else {
                const storedHistory = JSON.parse(localStorage.getItem('moodHistory') || '[]');
                setHistory(storedHistory);
            }
        };
        loadHistory();
    }, [user]);

    // Helper to get mood for a specific date
    const getMoodForDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return history.find(entry => entry.date === dateStr);
    };

    // Custom day renderer for the calendar
    const footer = (
        <div className="flex flex-wrap gap-4 justify-center mt-4 text-xs text-muted-foreground">
            {Object.entries(moodsInfo).map(([key, info]) => (
                <div key={key} className="flex items-center gap-1">
                    <span className={`w-3 h-3 rounded-full ${info.color}`}></span>
                    {info.label}
                </div>
            ))}
        </div>
    );

    const modifiers = {
        great: (date: Date) => getMoodForDate(date)?.mood === 'great',
        good: (date: Date) => getMoodForDate(date)?.mood === 'good',
        okay: (date: Date) => getMoodForDate(date)?.mood === 'okay',
        meh: (date: Date) => getMoodForDate(date)?.mood === 'meh',
        bad: (date: Date) => getMoodForDate(date)?.mood === 'bad',
    };

    const modifiersStyles = {
        great: { backgroundColor: '#fce7f3', color: '#be185d', fontWeight: 'bold' }, // pink-100
        good: { backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 'bold' }, // green-100
        okay: { backgroundColor: '#fef9c3', color: '#a16207', fontWeight: 'bold' }, // yellow-100
        meh: { backgroundColor: '#f3f4f6', color: '#374151', fontWeight: 'bold' }, // gray-100
        bad: { backgroundColor: '#dbeafe', color: '#1d4ed8', fontWeight: 'bold' }, // blue-100
    };

    return (
        <div className="container mx-auto px-4 max-w-4xl">
            <Card className="card-neural mb-8">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold gradient-text">Mood History</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <div className="p-4 bg-white/50 rounded-2xl shadow-sm border border-border">
                        <DayPicker
                            mode="single"
                            month={month}
                            onMonthChange={setMonth}
                            modifiers={modifiers}
                            modifiersStyles={modifiersStyles}
                            footer={footer}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Chart Section */}
            <Card className="card-neural mb-8">
                <CardHeader>
                    <CardTitle className="text-lg">Mood Trends</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[...history].reverse()} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                style={{ fontSize: '0.75rem' }}
                            />
                            <YAxis
                                domain={[0, 6]}
                                ticks={[1, 2, 3, 4, 5]}
                                tickFormatter={(value) => {
                                    if (value === 5) return 'Great';
                                    if (value === 4) return 'Good';
                                    if (value === 3) return 'Okay';
                                    if (value === 2) return 'Meh';
                                    if (value === 1) return 'Bad';
                                    return '';
                                }}
                                style={{ fontSize: '0.75rem' }}
                                width={50}
                            />
                            <Tooltip
                                labelFormatter={(date) => new Date(date as string).toLocaleDateString()}
                                formatter={(value: any) => {
                                    if (value === 5) return ['Great', 'Mood'];
                                    if (value === 4) return ['Good', 'Mood'];
                                    if (value === 3) return ['Okay', 'Mood'];
                                    if (value === 2) return ['Meh', 'Mood'];
                                    if (value === 1) return ['Bad', 'Mood'];
                                    return [value, 'Score'];
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey={(entry) => moodMap[entry.mood as keyof typeof moodMap] || 3}
                                stroke="#8884d8"
                                strokeWidth={2}
                                dot={{ fill: '#8884d8', r: 4 }}
                                activeDot={{ r: 8 }}
                                name="Mood"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Entries */}
                <Card className="card-neural">
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Check-ins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {history.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No mood entries yet.</p>
                            ) : (
                                [...history].reverse().slice(0, 5).map((entry, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                                        <span className="text-sm font-medium">{new Date(entry.date).toLocaleDateString()}</span>
                                        <div className="flex items-center gap-2">
                                            {moodsInfo[entry.mood as keyof typeof moodsInfo]?.icon}
                                            <span className="text-sm capitalize">{entry.mood}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Placeholder */}
                <Card className="card-neural">
                    <CardHeader>
                        <CardTitle className="text-lg">Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Keep tracking your mood to see patterns here.</p>
                        {/* Future: Add chart or summary stats */}
                        <div className="mt-4 flex flex-col gap-2">
                            <div className="text-sm">Total Check-ins: <span className="font-bold">{history.length}</span></div>
                            {/* <div className="text-sm">Most Common Mood: <span className="font-bold">Good</span></div> */}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default MoodDashboard;
