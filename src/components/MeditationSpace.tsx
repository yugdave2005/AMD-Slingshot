import React, { useState, useEffect, useRef, memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Square, Zap, Music, Timer, CheckCircle, X, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { updateMeditationStreak, fetchMeditationStats } from "@/lib/db";

// --- Types ---
type MeditationView = 'dashboard' | 'setup' | 'session' | 'completed';
type MeditationData = { date: string; minutes: number };

// --- Child Components ---

const BreathingAnimation = memo(({ isPlaying }: { isPlaying: boolean }) => (
  <>
    <style>{`
      @keyframes breathe-outer {
        0%, 100% { transform: scale(0.95); opacity: 0.7; }
        50% { transform: scale(1); opacity: 1; }
      }
      @keyframes breathe-inner {
         0%, 100% { transform: scale(0.95); opacity: 0.8; }
        50% { transform: scale(1); opacity: 1; }
      }
      .animate-breathing {
        animation-play-state: paused;
        animation-timing-function: cubic-bezier(0.45, 0.05, 0.55, 0.95);
        animation-iteration-count: infinite;
        animation-duration: 8s;
      }
      .animate-breathing.is-playing {
        animation-play-state: running;
      }
    `}</style>
    <div className="w-[320px] h-[320px] md:w-[400px] md:h-[400px] flex items-center justify-center">
      <div
        className={cn("animate-breathing w-full h-full rounded-full bg-primary/20 flex items-center justify-center", isPlaying && "is-playing")}
        style={{ animationName: 'breathe-outer' }}
      >
        <div
          className={cn("animate-breathing w-[75%] h-[75%] rounded-full bg-primary/40", isPlaying && "is-playing")}
          style={{ animationName: 'breathe-inner' }}
        />
      </div>
    </div>
  </>
));
BreathingAnimation.displayName = 'BreathingAnimation';


const ContributionGraph = ({ data }: { data: MeditationData[] }) => {
  const today = new Date();
  const recentData = data.filter(d => {
    const date = new Date(d.date);
    const diffDays = (today.getTime() - date.getTime()) / (1000 * 3600 * 24);
    return diffDays < 7;
  });
  const totalMinutes = recentData.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <div className="p-4 border border-border/50 rounded-lg bg-card/50 backdrop-blur-sm mt-4">
      <h4 className="text-sm font-medium text-muted-foreground mb-2">Meditation Activity (Last 7 Days)</h4>
      <div className='text-center text-3xl font-bold gradient-text'>{totalMinutes} Minutes</div>
      <p className="text-xs text-muted-foreground text-center mt-2">(Contribution Graph Placeholder)</p>
    </div>
  );
};

const TimerDisplay = memo(({
  initialTime,
  isPlaying,
  onComplete
}: {
  initialTime: number;
  isPlaying: boolean;
  onComplete: () => void;
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isPlaying && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, timeLeft, onComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <p className="text-6xl md:text-7xl font-mono font-thin tracking-widest mt-8">
      {formatTime(timeLeft)}
    </p>
  );
});
TimerDisplay.displayName = 'TimerDisplay';


// --- Main Component ---
const MeditationSpace = () => {
  const [view, setView] = useState<MeditationView>('dashboard');
  const [streak, setStreak] = useState<number>(() => parseInt(localStorage.getItem('meditationStreak') || '0', 10));
  const [history, setHistory] = useState<MeditationData[]>(() => {
    try { return JSON.parse(localStorage.getItem('meditationHistory') || '[]'); } catch { return []; }
  });
  const [lastSessionDuration, setLastSessionDuration] = useState<number | null>(null);

  const [selectedMusic, setSelectedMusic] = useState<string>("calm-waves");
  const [selectedDuration, setSelectedDuration] = useState<number>(300);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const musicOptions = [
    { value: "calm-waves", label: "Calm Waves", url: "/audio/calm-waves.mp3" },
    { value: "forest-ambience", label: "Forest Ambience", url: "/audio/forest-ambience.mp3" },
    { value: "neural-harmony", label: "Neural Harmony", url: "https://storage.googleapis.com/well-weave-assets/neural-harmony.mp3" },
    { value: "none", label: "No Music", url: "" },
  ];
  const durationOptions = [{ value: 300, label: "5 Minutes" }, { value: 600, label: "10 Minutes" }, { value: 900, label: "15 Minutes" }];

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    const defaultTrack = musicOptions.find(opt => opt.value === selectedMusic);
    if (defaultTrack?.url && audioRef.current) {
      audioRef.current.src = defaultTrack.url;
    }
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    const track = musicOptions.find(opt => opt.value === selectedMusic);
    if (audioRef.current && track) {
      const newSrc = track.url || "";
      const currentFullSrc = audioRef.current.src;
      const newFullSrc = newSrc ? new URL(newSrc, window.location.origin).href : "";

      if (currentFullSrc !== newFullSrc) {
        audioRef.current.src = newSrc;
        if (isPlaying && newSrc) {
          audioRef.current.play().catch(e => console.error("Audio play error:", e));
        } else {
          audioRef.current.pause();
        }
      }
    }
  }, [selectedMusic, isPlaying]);


  useEffect(() => {
    const playAudio = async () => {
      if (audioRef.current?.src) {
        try {
          await audioRef.current?.play();
        } catch (error) {
          console.error("Error playing audio:", error);
        }
      }
    };
    if (isPlaying) {
      playAudio();
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying]);


  const handleStartSetup = () => {
    setIsPlaying(false);
    setView('setup');
  };

  const handleBeginSession = () => {
    setView('session');
    setIsPlaying(false);
  };

  const { user } = useAuth();

  useEffect(() => {
    // 1. Initial Load: Check local cache first for instant streak display
    const cachedStreak = localStorage.getItem('meditationStreak');
    if (cachedStreak) {
      setStreak(parseInt(cachedStreak, 10));
    }
    const cachedHistory = localStorage.getItem('meditationHistory');
    if (cachedHistory) {
      try {
        setHistory(JSON.parse(cachedHistory));
      } catch (e) { console.error("Cache parse error", e); }
    }

    // 2. Sync with DB if user exists (Background)
    if (user) {
      fetchMeditationStats(user.uid).then(stats => {
        // Only update if DB has data (could be empty for new user)
        if (stats.streak > 0 || stats.history.length > 0) {
          setStreak(stats.streak);
          setHistory(stats.history as MeditationData[]);

          // Update cache to match source of truth
          localStorage.setItem('meditationStreak', stats.streak.toString());
          localStorage.setItem('meditationHistory', JSON.stringify(stats.history));
        }
      }).catch(e => console.error("Background streak sync failed:", e));
    }
  }, [user]);

  const handleStop = async (completed: boolean) => {
    setIsPlaying(false);

    if (completed) {
      const today = new Date().toISOString().split('T')[0];
      const minutes = Math.floor(selectedDuration / 60);
      setLastSessionDuration(minutes);

      // OPTIMISTIC UPDATE: Update State & Local Storage Immediately
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem('meditationStreak', newStreak.toString());

      const newHistory = [...history];
      const todayEntry = newHistory.find(e => e.date === today);
      if (todayEntry) {
        todayEntry.minutes += minutes;
      } else {
        newHistory.push({ date: today, minutes });
      }
      setHistory(newHistory);
      localStorage.setItem('meditationHistory', JSON.stringify(newHistory));

      // Background Cloud Sync
      if (user) {
        // We don't await this to block UI transition
        updateMeditationStreak(user.uid, newStreak, today, minutes).catch(e => {
          console.error("Cloud streak save failed:", e);
          // toast.error("Progress saved locally. Will sync when online."); 
          // Optional: add toast
        });
      }

      setView('completed');
    } else {
      setView('dashboard');
    }

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const DashboardView = () => (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold gradient-text">Meditation Space</CardTitle>
        <div className="flex items-center justify-center gap-2 text-primary mt-4">
          <Zap className="w-8 h-8" />
          <span className="text-4xl font-semibold">{streak} Day Streak</span>
        </div>
      </CardHeader>
      <CardContent>
        <ContributionGraph data={history} />
      </CardContent>
      <CardFooter className="flex justify-center mt-6">
        <Button variant="neural" size="lg" onClick={handleStartSetup} className="px-10 py-6 text-xl rounded-full">
          Start Today's Session
        </Button>
      </CardFooter>
    </>
  );

  const SetupView = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h2 className="text-4xl font-bold gradient-text">Get Ready</h2>
      <p className="text-muted-foreground mt-2 mb-8">Find a comfortable position and prepare for your session.</p>

      <div className="flex items-center gap-2 p-3 mb-8 rounded-lg bg-primary/10 text-primary">
        <Headphones size={20} className="text-primary flex-shrink-0" />
        <span className="text-sm font-semibold">For the best experience, please use headphones.</span>
      </div>

      <div className="w-full max-w-xs space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center justify-center gap-2"><Timer size={16} /> Duration</label>
          <Select value={String(selectedDuration)} onValueChange={(v) => setSelectedDuration(Number(v))}>
            <SelectTrigger className="w-full bg-input border border-input h-12 text-base text-foreground font-medium shadow-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{durationOptions.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center justify-center gap-2"><Music size={16} /> Background Music</label>
          <Select value={selectedMusic} onValueChange={setSelectedMusic}>
            <SelectTrigger className="w-full bg-input border border-input h-12 text-base text-foreground font-medium shadow-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{musicOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <Button variant="neural" size="lg" onClick={handleBeginSession} className="mt-12 px-12 py-6 text-xl rounded-full">
        Begin
      </Button>
    </div>
  );


  const ImmersiveSessionView = () => (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center text-white transition-opacity duration-500 animate-in fade-in-50">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-20"
        src="https://storage.googleapis.com/well-weave-assets/space-background.mp4"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
        <Button variant="ghost" size="icon" onClick={() => handleStop(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
          <X size={24} />
        </Button>
        <BreathingAnimation isPlaying={isPlaying} />
        <TimerDisplay
          initialTime={selectedDuration}
          isPlaying={isPlaying}
          onComplete={() => handleStop(true)}
        />
        <div className="absolute bottom-10 flex gap-4">
          <Button variant="glass" size="lg" onClick={() => setIsPlaying(!isPlaying)} className="px-8 py-4 text-lg rounded-full w-40">
            {isPlaying ? <><Pause className="mr-2" /> Pause</> : <><Play className="mr-2" /> Play</>}
          </Button>
        </div>
      </div>
    </div>
  );

  const CompletionView = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in-50">
      <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
      <CardTitle className="text-3xl font-bold gradient-text">Session Complete</CardTitle>
      {lastSessionDuration !== null && (
        <CardDescription className="text-xl mt-2">You meditated for {lastSessionDuration} minutes.</CardDescription>
      )}
      <div className="flex items-center justify-center gap-2 text-primary my-6">
        <Zap className="w-8 h-8" />
        <span className="text-3xl font-semibold">{streak} Day Streak!</span>
      </div>
      <p className="text-muted-foreground max-w-sm">Well done on investing in your well-being. We're looking forward to seeing you again tomorrow.</p>
      <Button variant="neural" size="lg" onClick={() => setView('dashboard')} className="mt-10 px-10 py-5 text-lg rounded-full">
        Back to Dashboard
      </Button>
    </div>
  );

  // --- Render Logic ---
  if (view === 'session') return <ImmersiveSessionView />;

  return (
    <Card className="card-neural w-full max-w-2xl mx-auto mt-8 border-border/50 shadow-lg min-h-[500px] flex flex-col justify-center">
      {view === 'dashboard' && <DashboardView />}
      {view === 'setup' && <SetupView />}
      {view === 'completed' && <CompletionView />}
    </Card>
  );
};

export default MeditationSpace;

