
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchFitnessData, fetchSleepData, fetchMockFitnessData, fetchMockSleepData, FitnessMetric, SleepSession } from '@/lib/fitness';
import { analyzeHealthData } from '@/lib/gemini-advisor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Activity, Flame, Heart, Moon, Brain, ChevronLeft, Loader2, PlayCircle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';

const FitnessDashboard = () => {
    const { googleAccessToken, connectGoogleFit, disconnectGoogleFit } = useAuth();
    const navigate = useNavigate();

    const [fitnessData, setFitnessData] = useState<FitnessMetric[]>([]);
    const [sleepData, setSleepData] = useState<SleepSession[]>([]);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [demoMode, setDemoMode] = useState(false);

    const generateInsights = useCallback(async (metrics: FitnessMetric[], sleep: SleepSession[]) => {
        console.log("Generating insights for", metrics.length, "metrics");
        setAnalyzing(true);
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                toast.error("Missing Gemini API Key in .env file");
                setAiInsight("AI Configuration Error: VITE_GEMINI_API_KEY is missing.");
                return;
            }

            const insight = await analyzeHealthData(metrics, sleep);
            console.log("Insight generated:", insight?.substring(0, 50) + "...");
            setAiInsight(insight);
        } catch (e: any) {
            console.error("Insight Generation Error:", e);
            toast.error(`AI Error: ${e.message}`);
            setAiInsight(`Error generating insights: ${e.message}`);
        } finally {
            setAnalyzing(false);
        }
    }, []);

    const loadData = useCallback(async () => {
        if (!googleAccessToken && !demoMode) return;
        setLoading(true);
        try {
            const endDate = Date.now();
            const startDate = endDate - 7 * 24 * 60 * 60 * 1000; // 7 days ago

            let fitMetrics: FitnessMetric[] = [];
            let sleepSessions: SleepSession[] = [];

            if (demoMode) {
                fitMetrics = await fetchMockFitnessData(startDate, endDate);
                sleepSessions = await fetchMockSleepData(startDate, endDate);
                if (fitMetrics.length > 0) toast.success("Loaded Demo Data");
            } else if (googleAccessToken) {
                [fitMetrics, sleepSessions] = await Promise.all([
                    fetchFitnessData(googleAccessToken, startDate, endDate),
                    fetchSleepData(googleAccessToken, startDate, endDate)
                ]);
            }

            setFitnessData(fitMetrics);
            setSleepData(sleepSessions);

            // Auto-trigger analysis if data exists
            if (fitMetrics.length > 0) {
                generateInsights(fitMetrics, sleepSessions);
            }
        } catch (error: any) {
            console.error(error);
            // Show exact error to user for debugging
            toast.error(`Error: ${error.message}`);

            if (!demoMode) {
                if (error.message?.includes('401')) {
                    // 401 is token expiry or invalid
                    disconnectGoogleFit();
                }
                if (error.message?.includes('403')) {
                    const { firebaseConfig } = await import("@/lib/firebase");
                    toast.error(`Error: 403 Forbidden. Is Fitness API enabled in project "${firebaseConfig.projectId}"?`, {
                        description: "Resetting connection to try again...",
                        duration: 5000
                    });
                    // Force disconnect to allow user to try again with a fresh token
                    setTimeout(() => disconnectGoogleFit(), 3000);
                }
            }
        } finally {
            setLoading(false);
        }
    }, [googleAccessToken, demoMode, generateInsights, disconnectGoogleFit]);

    useEffect(() => {
        if (googleAccessToken || demoMode) {
            loadData();
        }
    }, [googleAccessToken, demoMode, loadData]);

    // Derived stats for today (or last available day)
    const today = fitnessData.length > 0 ? fitnessData[fitnessData.length - 1] : null;

    if (!googleAccessToken && !demoMode) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-6 pt-24 pb-12 flex flex-col items-center justify-center min-h-[80vh]">
                    <Card className="w-full max-w-md text-center border-none shadow-xl bg-gradient-to-br from-card to-muted/50">
                        <CardHeader>
                            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <Activity className="w-8 h-8 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-bold">Connect Google Fit</CardTitle>
                            <CardDescription>
                                Sync your steps, sleep, and heart data to unlock personalized AI-powered health insights.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                size="lg"
                                className="w-full gap-2"
                                onClick={connectGoogleFit}
                            >
                                <img src="https://www.gstatic.com/images/branding/product/1x/gfit_512dp.png" alt="Fit" className="w-5 h-5" />
                                Connect with Google Fit
                            </Button>
                            <div className="mt-4 pt-4 border-t">
                                <Button variant="ghost" size="sm" onClick={() => setDemoMode(true)} className="text-muted-foreground w-full">
                                    <PlayCircle className="w-4 h-4 mr-2" />
                                    Try Demo Mode (Mock Data)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 pt-24">
            <Navbar />

            <div className="container mx-auto max-w-6xl space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <Button variant="ghost" className="mb-2 pl-0 hover:pl-2 transition-all" onClick={() => navigate('/')}>
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
                        </Button>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
                            Fitness & Wellbeing
                        </h1>
                        <p className="text-muted-foreground mt-1">Your physical health journey, visualized.</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        {demoMode && (
                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 mr-2">
                                Warning: Demo Data
                            </Badge>
                        )}
                        <Button variant="outline" onClick={disconnectGoogleFit} className="text-destructive hover:text-destructive">
                            Disconnect
                        </Button>
                        <Button variant="outline" onClick={loadData} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Refresh Data"}
                        </Button>
                    </div>
                </div>

                {loading && !today ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted/30 animate-pulse rounded-xl" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="Steps Today"
                            value={today?.steps || 0}
                            unit="steps"
                            icon={Activity}
                            color="text-blue-500"
                        />
                        <MetricCard
                            title="Calories Burned"
                            value={today?.calories || 0}
                            unit="kcal"
                            icon={Flame}
                            color="text-orange-500"
                        />
                        <MetricCard
                            title="Heart Points"
                            value={today?.heartPoints || 0}
                            unit="pts"
                            icon={Heart}
                            color="text-red-500"
                        />
                        <MetricCard
                            title="Sleep Avg"
                            value={Math.round(sleepData.reduce((acc, s) => acc + s.durationMinutes, 0) / (sleepData.length || 1) / 60)}
                            unit="hours"
                            icon={Moon}
                            color="text-indigo-500"
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Charts Section */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Activity Trends</CardTitle>
                                <CardDescription>Your daily steps over the last week</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={fitnessData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '8px', border: 'none' }}
                                            labelStyle={{ color: '#fff' }}
                                        />
                                        <Bar dataKey="steps" fill="currentColor" className="fill-primary" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Heart Health</CardTitle>
                                <CardDescription>Heart points earned</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={fitnessData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '8px', border: 'none' }}
                                            labelStyle={{ color: '#fff' }}
                                        />
                                        <Line type="monotone" dataKey="heartPoints" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* AI Insights Section */}
                    <div className="lg:col-span-1">
                        <Card className="h-full border-none shadow-xl bg-gradient-to-b from-purple-500/10 to-blue-500/10 border-l-4 border-l-purple-500">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Brain className="w-6 h-6 text-purple-500" />
                                    <CardTitle>AI Health Coach</CardTitle>
                                </div>
                                <CardDescription>Personalized insights based on your data</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {analyzing ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                                        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                                        <p className="text-sm text-muted-foreground">Analyzing your sleep & activity patterns...</p>
                                    </div>
                                ) : aiInsight ? (
                                    <div className="space-y-4">
                                        {(() => {
                                            try {
                                                // Function to get Icon
                                                const getIcon = (iconName: string) => {
                                                    const icons: any = { Walk: Activity, Run: Flame, Sleep: Moon, Water: Activity, Food: Heart, Heart: Heart, Brain: Brain };
                                                    const Icon = icons[iconName] || Activity;
                                                    return <Icon className="w-4 h-4 text-white" />;
                                                };

                                                const data = JSON.parse(aiInsight);

                                                if (typeof data !== 'object') return <p>{aiInsight}</p>;

                                                return (
                                                    <>
                                                        <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                                                            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-2">
                                                                <Brain className="w-4 h-4" /> Assessment
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                                {data.assessment}
                                                            </p>
                                                        </div>

                                                        {data.highlights && (
                                                            <div className="space-y-2">
                                                                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider ml-1">Highlights</h4>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {data.highlights.map((h: string, i: number) => (
                                                                        <div key={i} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2 rounded text-xs font-medium flex items-center gap-2">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                                            {h}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {data.recommendations && (
                                                            <div className="space-y-2">
                                                                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider ml-1">Coach Tips</h4>
                                                                <div className="space-y-2">
                                                                    {data.recommendations.map((rec: any, i: number) => (
                                                                        <div key={i} className="flex items-center gap-3 bg-card p-2 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                                                                            <div className={`p-2 rounded-full shrink-0 ${['bg-blue-500', 'bg-indigo-500', 'bg-pink-500', 'bg-orange-500'][i % 4]}`}>
                                                                                {getIcon(rec.icon)}
                                                                            </div>
                                                                            <p className="text-xs font-medium">{rec.tip}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            } catch (e) {
                                                // Fallback if not JSON
                                                return <p className="whitespace-pre-wrap text-sm">{aiInsight}</p>;
                                            }
                                        })()}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>Sync data to get insights.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Component for KPI Cards
const MetricCard = ({ title, value, unit, icon: Icon, color }: any) => (
    <Card className="border-none shadow-sm bg-card hover:bg-card/80 transition-colors">
        <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className="flex items-baseline space-x-1">
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground font-medium">{unit}</div>
            </div>
        </CardContent>
    </Card>
);

export default FitnessDashboard;
