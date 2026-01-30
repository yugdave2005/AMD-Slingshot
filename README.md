# Well-Weave AI


[![React](https://img.shields.io/badge/React-18.2.0-blue.svg?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0.0-green.svg?logo=vite)](https://vitejs.dev/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-2.5--pro-orange.svg?logo=google)](https://ai.google.dev/)

**Well-Weave AI** is an innovative mental wellness journaling app powered by AI. Users can pour their thoughts into a digital journal, where advanced AI analysis (via Google Gemini) extracts emotions, concepts, people, and triggers to build a **dynamic mind graph**.  

Visualize your emotional patterns, explore connections, and chat with an empathetic AI guide for insights, advice, and support. For serious topics like depression or suicidal thoughts, the guide provides **helpline resources** to ensure user safety.

This full-stack React app combines intuitive UI/UX with AI-driven personalization to foster **self-awareness and emotional growth**.

### 📺 [Watch the Demo Video](https://youtu.be/CLAenmJ0HaA?si=VBW5qctcXqG7y8-L)

---

## ✨ Features

- **Immersive 3D Mind Graph**: Visualize your mental state as a glowing "constellation" of thoughts. Fully interactive 3D view with zoom, pan, and rotate controls.
- **Ethereal Journey UI**: A fluid, "Portal"-based interface that replaces traditional navigation with immersive transitions and state-driven journeys.
- **AI-Powered Journaling & Analysis**: "Stream of Consciousness" journaling where **Gemini 2.0 Flash** analyzes entries to extract emotions, triggers, and entities, updating your Mind Graph in real-time.
- **AI Health Coach ("Meliora")**: A context-aware companion that tracks your mood and fitness metrics (sleep, steps), providing actionable "micro-tips" and empathetic support.
- **Therapist Connect**: Seamlessly book sessions with professional support. Integrated with **Google Calendar** to automatically generate **Google Meet** video links.
- **Meditation Space**: A dedicated "Deep Dive" mode for guided breathing and focus, helping you center your mind.
- **Privacy & Safety**: Client-side processing for privacy, with safety mechanisms that detect crisis keywords and provide helpline resources (e.g., 988).  

---

## 🛠 Tech Stack

| Category            | Technologies |
|---------------------|--------------------------------------------------|
| **Frontend**        | React 18, Vite, TypeScript |
| **UI Library**      | shadcn/ui, Tailwind CSS, Framer Motion, Lucide React |
| **AI/ML**           | Google Gemini API (`gemini-2.0-flash`), Google Calendar API |
| **Visualization**   | Three.js, React Force Graph 3D, D3.js |
| **State Management**| React Hooks (`useState`, `useEffect`) |
| **Other**           | React Toast (notifications), Error Boundaries |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm/yarn.
- **Google Gemini API key** (free tier available): [Get one here](https://aistudio.google.com/app/apikey).

### Installation

```bash
# Clone the repo
git clone https://github.com/ParthZadeshwariya/TechSprint-WellWeave.git
cd TechSprint-WellWeave

# Install dependencies
npm install

# Run the app
npm run dev
```