
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FitnessMetric, SleepSession } from "./fitness";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export const analyzeHealthData = async (
    metrics: FitnessMetric[],
    sleepSessions: SleepSession[]
): Promise<string> => {
    if (!API_KEY) {
        return "Gemini API Key is missing. Please configure VITE_GEMINI_API_KEY in your environment variables to enable AI insights.";
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const metricsSummary = metrics.map(m =>
            `- ${m.date}: ${m.steps} steps, ${m.calories} cal, ${m.heartPoints} pts`
        ).join('\n');

        const sleepSummary = sleepSessions.length > 0
            ? sleepSessions.map(s => `- ${s.durationMinutes} mins (${s.startTime} - ${s.endTime})`).join('\n')
            : "No recent sleep data available.";

        const prompt = `
    You are WellWeave's AI Health Coach.
    Analyze the following fitness and sleep data for the user:
    
    Recent Activity (Last 7 Days):
    ${metricsSummary}
    
    Recent Sleep:
    ${sleepSummary}
    
    Provide a response in strict JSON format. Do not use Markdown code blocks. The JSON should follow this structure based on the schema:
    {
        "assessment": "A brief summary of their activity levels and sleep patterns (max 2 sentences).",
        "highlights": ["Highlight 1", "Highlight 2"],
        "recommendations": [
            { "icon": "Walk", "tip": "Short actionable tip 1 (max 8 words)" },
            { "icon": "Sleep", "tip": "Short actionable tip 2 (max 8 words)" },
            { "icon": "Water", "tip": "Short actionable tip 3 (max 8 words)" },
             { "icon": "Heart", "tip": "Short actionable tip 4 (max 8 words)" }
        ]
    }
    
    Rules:
    - Keep "assessment" strictly under 30 words.
    - Provide exactly 2 "highlights".
    - Provide exactly 4 "recommendations".
    - Each "tip" must be very short and punchy.
    - Valid icons for recommendations are: "Walk", "Run", "Sleep", "Water", "Food", "Heart", "Brain".
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if Gemini adds them
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return jsonStr;
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw error;
    }
};
