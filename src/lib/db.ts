
import {
    collection,
    doc,
    setDoc,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    updateDoc,
    getDoc,
    serverTimestamp,
    limit
} from "firebase/firestore";
import { db } from "./firebase";
import { User } from "firebase/auth";
import { ThoughtNode, ThoughtEntry } from "@/components/ThoughtAnalyzer";

// --- Types ---
// Re-using types where possible or defining simple interfaces for DB structures

// --- User Profile ---
export const ensureUserProfile = async (user: User) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            display_name: user.displayName || "Traveler",
            account_created_at: new Date().toISOString(),
            lastActive: serverTimestamp()
        });
    } else {
        await updateDoc(userRef, {
            lastActive: serverTimestamp()
        });
    }
};

// --- Chats ---
export const logChatMessage = async (uid: string, message: string, listSender: 'user' | 'assistant') => {
    try {
        const chatsRef = collection(db, "users", uid, "chats");
        await addDoc(chatsRef, {
            timestamp: serverTimestamp(), // Use server timestamp for ordering
            local_timestamp: new Date().toISOString(),
            sender: listSender,
            message_content: message
        });
    } catch (e) {
        console.error("Error logging chat:", e);
        throw e;
    }
};

export const fetchChatHistory = async (uid: string) => {
    try {
        const chatsRef = collection(db, "users", uid, "chats");
        const q = query(chatsRef, orderBy("timestamp", "asc"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            role: doc.data().sender as 'user' | 'assistant',
            content: doc.data().message_content as string
        }));
    } catch (e) {
        console.error("Error fetching chat history:", e);
        throw e;
    }
};

// --- Mood Tracker ---
export const logMoodCheckIn = async (uid: string, mood: string, date: string) => {
    try {
        // date format: YYYY-MM-DD
        const moodRef = doc(db, "users", uid, "mood_tracker", date);
        await setDoc(moodRef, {
            date,
            mood_score: mood,
            notes: "",
            timestamp: serverTimestamp()
        }, { merge: true });
    } catch (e) {
        console.error("Error logging mood:", e);
        throw e;
    }
};

export const fetchMoodHistory = async (uid: string) => {
    try {
        const moodsRef = collection(db, "users", uid, "mood_tracker");
        const q = query(moodsRef, orderBy("date", "asc"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            date: doc.data().date as string,
            mood: doc.data().mood_score as string
        }));
    } catch (e) {
        console.error("Error fetching mood history:", e);
        throw e;
    }
};

// --- Progress/Streaks ---
export const updateMeditationStreak = async (uid: string, streakCount: number, lastDate: string, minutes: number) => {
    try {
        // Changed to 'streak_stats' as requested
        const progressRef = doc(db, "users", uid, "progress", "streak_stats");
        await setDoc(progressRef, {
            current_streak: streakCount,
            last_meditation_date: lastDate,
            total_minutes: 0
        }, { merge: true });

        // Also log the individual session
        const sessionsRef = collection(db, "users", uid, "meditation_sessions");
        await addDoc(sessionsRef, {
            date: lastDate,
            minutes: minutes,
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error("Error updating streak:", e);
        throw e;
    }
};

export const fetchMeditationStats = async (uid: string) => {
    try {
        const progressRef = doc(db, "users", uid, "progress", "streak_stats");
        const progressSnap = await getDoc(progressRef);

        let streak = 0;

        if (progressSnap.exists()) {
            streak = progressSnap.data().current_streak || 0;
        }

        // Fetch recent history
        const sessionsRef = collection(db, "users", uid, "meditation_sessions");
        const q = query(sessionsRef, orderBy("date", "desc"), limit(30));
        const sessionsSnap = await getDocs(q);

        const history = sessionsSnap.docs.map(doc => ({
            date: doc.data().date,
            minutes: doc.data().minutes
        })).reverse();

        return { streak, history };
    } catch (e) {
        console.error("Error fetching med stats:", e);
        throw e;
    }
};

// --- Visualizations / Mind Graph ---
export const saveMindGraph = async (uid: string, nodes: ThoughtNode[], entries: ThoughtEntry[]) => {
    try {
        const graphRef = doc(db, "users", uid, "visualizations", "mind_graph_current");
        await setDoc(graphRef, {
            updated_at: serverTimestamp(),
            node_count: nodes.length,
            entry_count: entries.length,
            data: JSON.stringify({ nodes, entries })
        });
        console.log("Mind Graph saved successfully");
    } catch (e) {
        console.error("Error saving mind graph:", e);
        throw e;
    }
};

export const fetchMindGraph = async (uid: string) => {
    try {
        const graphRef = doc(db, "users", uid, "visualizations", "mind_graph_current");
        const docSnap = await getDoc(graphRef);

        if (docSnap.exists() && docSnap.data().data) {
            return JSON.parse(docSnap.data().data);
        }
        return { nodes: [], entries: [] };
    } catch (e) {
        console.error("Error fetching mind graph:", e);
        throw e;
    }
};
// --- Achievements ---
export const unlockAchievement = async (uid: string, achievementId: string) => {
    try {
        const achievementRef = doc(db, "users", uid, "achievements", achievementId);
        await setDoc(achievementRef, {
            id: achievementId,
            unlocked_at: serverTimestamp(),
            unlocked: true
        }, { merge: true });
    } catch (e) {
        console.error("Error unlocking achievement:", e);
        throw e;
    }
};

export const fetchAchievements = async (uid: string) => {
    try {
        const achievementsRef = collection(db, "users", uid, "achievements");
        const querySnapshot = await getDocs(achievementsRef);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            unlocked_at: doc.data().unlocked_at,
            unlocked: true
        }));
    } catch (e) {
        console.error("Error fetching achievements:", e);
        throw e;
    }
};

export const fetchJournalEntries = async (uid: string) => {
    try {
        // Assuming journal entries are stored as visual entries based on other parts of the code
        // Or if they are part of the 'mind graph' entries.
        // Based on analysis, they seem to be part of the 'visualizations' -> 'entries' in saveMindGraph
        // But let's check for a specific collection if it exists. 
        // Re-reading code: 'ThoughtEntry' is used in saveMindGraph.
        // Let's add a function to get detailed entries if needed for export, 
        // or we can reuse fetchMindGraph if that's the canonical source.
        // For 'Export Data' feature, let's try to fetch all logged thoughts.

        // Wait, looking at logChatMessage... that seems to be the chat.
        // looking at saveMindGraph... entries are inside the big JSON blobl.
        // This might be heavy to parse for just an export, but it's the current architecture.

        const graphData = await fetchMindGraph(uid);
        return graphData.entries || [];
    } catch (e) {
        console.error("Error fetching journal entries:", e);
        return [];
    }
};
