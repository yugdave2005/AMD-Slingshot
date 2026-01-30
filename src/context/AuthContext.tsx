
import React, { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    logout: () => Promise<void>;
    googleAccessToken: string | null;
    connectGoogleFit: () => Promise<void>;
    disconnectGoogleFit: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(() => {
        return sessionStorage.getItem("googleAccessToken");
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    const { ensureUserProfile } = await import("@/lib/db");
                    await ensureUserProfile(currentUser);
                } catch (e) {
                    console.error("Profile sync error:", e);
                }
            } else {
                // Clear token on logout
                setGoogleAccessToken(null);
                sessionStorage.removeItem("googleAccessToken");
            }
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Persist token changes
    useEffect(() => {
        if (googleAccessToken) {
            sessionStorage.setItem("googleAccessToken", googleAccessToken);
        }
    }, [googleAccessToken]);

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email: string, password: string, displayName: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update Auth Profile
            await updateProfile(user, {
                displayName: displayName
            });

            // Force refresh of user state to reflect display name change
            setUser({ ...user, displayName: displayName });

            // Create User Profile in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                display_name: displayName,
                account_created_at: new Date().toISOString()
            });
        } catch (error) {
            console.error("Signup error:", error);
            throw error; // Re-throw to be caught by UI
        }
    };

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/calendar');
            provider.addScope('https://www.googleapis.com/auth/calendar.events');
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Attempt to get token right away if possible, though normal sign in might not have scopes
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
                setGoogleAccessToken(credential.accessToken);
            }

            // Create User Profile in Firestore if it doesn't exist
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    display_name: user.displayName || "Traveler",
                    account_created_at: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error("Google Sign In error:", error);
            throw error;
        }
    };

    const connectGoogleFit = async () => {
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/fitness.activity.read');
            provider.addScope('https://www.googleapis.com/auth/fitness.body.read');
            provider.addScope('https://www.googleapis.com/auth/fitness.sleep.read');

            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
                setGoogleAccessToken(credential.accessToken);
            }
        } catch (error) {
            console.error("Error connecting to Google Fit:", error);
            throw error;
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    const disconnectGoogleFit = () => {
        setGoogleAccessToken(null);
        sessionStorage.removeItem("googleAccessToken");
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, signUp, logout, googleAccessToken, connectGoogleFit, disconnectGoogleFit }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
