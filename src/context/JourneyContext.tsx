import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThoughtNode, ThoughtEntry } from '../components/ThoughtAnalyzer';
import { useAuth } from './AuthContext';
import { saveMindGraph, fetchMindGraph } from '@/lib/db';

export type JourneyMode = 'PORTAL' | 'JOURNAL' | 'MEDITATION' | 'WEAVE';

interface JourneyState {
    mode: JourneyMode;
    mood: string; // e.g., 'anxious', 'peaceful', 'neutral'
    intensity: number; // 0-1 range for visual effects
    nodes: ThoughtNode[];
    entries: ThoughtEntry[];
}

interface JourneyContextType {
    state: JourneyState;
    setMode: (mode: JourneyMode) => void;
    setMood: (mood: string, intensity?: number) => void;
    transitionTo: (mode: JourneyMode) => void;
    addEntry: (entry: ThoughtEntry, newNodes: ThoughtNode[]) => void;
    saveJourney: () => Promise<void>;
    loadJourney: () => Promise<void>;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export const JourneyProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<JourneyState>({
        mode: 'PORTAL',
        mood: 'neutral',
        intensity: 0.2,
        nodes: [],
        entries: []
    });

    const setMode = (mode: JourneyMode) => {
        setState(prev => ({ ...prev, mode }));
    };

    const setMood = (mood: string, intensity: number = 0.5) => {
        setState(prev => ({ ...prev, mood, intensity }));
    };

    const transitionTo = (mode: JourneyMode) => {
        // We can add animation triggers here later
        setMode(mode);
    };

    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchMindGraph(user.uid).then(graph => {
                if (graph.nodes.length > 0) {
                    setState(prev => ({
                        ...prev,
                        nodes: graph.nodes,
                        entries: graph.entries
                    }));
                }
            });
        }
    }, [user]);

    const addEntry = (entry: ThoughtEntry, newNodes: ThoughtNode[]) => {
        setState(prev => {
            // Merge nodes logic could go here or be pre-calculated
            // Simple merge for storage
            const updatedNodes = [...prev.nodes];
            newNodes.forEach(newNode => {
                const existingIndex = updatedNodes.findIndex(n => n.id === newNode.id);
                if (existingIndex >= 0) {
                    updatedNodes[existingIndex] = newNode;
                } else {
                    updatedNodes.push(newNode);
                }
            });

            const newState = {
                ...prev,
                entries: [...prev.entries, entry],
                nodes: updatedNodes
            };

            if (user) {
                saveMindGraph(user.uid, updatedNodes, newState.entries);
            }

            return newState;
        });
    };

    const saveJourney = async () => {
        if (!user) return;
        try {
            await saveMindGraph(user.uid, state.nodes, state.entries);
            // We can add a toast here if we want, or let the component do it
        } catch (e) {
            console.error("Save journey failed:", e);
            throw e;
        }
    };

    const loadJourney = async () => {
        if (!user) return;
        try {
            const graph = await fetchMindGraph(user.uid);
            if (graph.nodes.length > 0) {
                setState(prev => ({
                    ...prev,
                    nodes: graph.nodes,
                    entries: graph.entries
                }));
            }
        } catch (e) {
            console.error("Load journey failed:", e);
            throw e;
        }
    };

    return (
        <JourneyContext.Provider value={{ state, setMode, setMood, transitionTo, addEntry, saveJourney, loadJourney }}>
            {children}
        </JourneyContext.Provider>
    );
};

export const useJourney = () => {
    const context = useContext(JourneyContext);
    if (context === undefined) {
        throw new Error('useJourney must be used within a JourneyProvider');
    }
    return context;
};
