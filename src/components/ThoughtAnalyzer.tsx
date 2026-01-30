import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ThoughtNode {
  id: string;
  label: string;
  category: 'emotion' | 'person' | 'activity' | 'place' | 'concept' | 'trigger';
  intensity: number;
  connections: { id: string; strength: number }[];
  color: string;
  entries: string[]; // Store which entries this node appears in
}

export interface ThoughtEntry {
  id: string;
  text: string;
  timestamp: Date;
  nodes: string[]; // IDs of nodes found in this entry
}

class ThoughtAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: any; // GenerativeModel type, but keeping it loose for simplicity

  private emotionWords = {
    anxiety: ['anxious', 'worried', 'nervous', 'stress', 'fear', 'panic', 'overwhelmed'],
    happiness: ['happy', 'joy', 'excited', 'pleased', 'content', 'grateful', 'cheerful'],
    sadness: ['sad', 'depressed', 'down', 'upset', 'melancholy', 'grief', 'disappointed'],
    anger: ['angry', 'mad', 'frustrated', 'irritated', 'furious', 'annoyed', 'rage'],
    love: ['love', 'affection', 'care', 'adore', 'cherish', 'romance', 'relationship'],
    calm: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'zen', 'meditative']
  };

  private categoryPatterns = {
    person: /\b(mom|dad|mother|father|friend|colleague|boss|partner|family|sibling|brother|sister|teacher|doctor|therapist)\b/gi,
    activity: /\b(work|school|exercise|sleep|eat|walk|run|read|write|study|meeting|class|vacation|hobby)\b/gi,
    place: /\b(home|office|school|gym|park|beach|restaurant|hospital|room|bed|car|outside)\b/gi,
    concept: /\b(future|past|money|health|career|goals|dreams|expectations|responsibility|freedom|time|change)\b/gi
  };

  private nodeColors = {
    emotion: {
      anxiety: 'bg-destructive',
      sadness: 'bg-accent',
      anger: 'bg-destructive/80',
      happiness: 'bg-primary',
      love: 'bg-primary-glow',
      calm: 'bg-primary/80'
    },
    person: 'bg-secondary',
    activity: 'bg-muted',
    place: 'bg-accent/60',
    concept: 'bg-primary/60',
    trigger: 'bg-destructive/60'
  };

  /**
   * Constructs the ThoughtAnalyzer with a Gemini API key.
   * @param apiKey The API key for Google's Generative AI.
   */
  constructor(apiKey: string = import.meta.env.VITE_GEMINI_API_KEY || '') {
    console.log('API Key:', apiKey); // Temporary debug log
    if (!apiKey) {
      throw new Error('Gemini API key is required. Set VITE_GEMINI_API_KEY in your environment.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  }

  /**
   * Analyzes a journal entry using the Gemini AI model to extract thought nodes.
   * @param text The journal entry text to analyze.
   * @param entryId The ID of the journal entry.
   * @returns A promise resolving to an object containing the extracted nodes and the entry.
   */
  async analyzeText(text: string, entryId: string): Promise<{ nodes: ThoughtNode[], entry: ThoughtEntry }> {
    const prompt = `
      Analyze the following journal entry text: "${text}"

      Extract key thought nodes based on these guidelines:
      - Emotions: Detect from word lists: ${JSON.stringify(this.emotionWords)}
        - For each detected emotion subcategory (e.g., 'anxiety'), create a node.
        - Intensity: Number of matching words * 2, capped at 10.
        - ID: "emotion-[subcategory]" (lowercase subcategory)
        - Label: Capitalized subcategory (e.g., "Anxiety")
        - Category: "emotion"
      - Other categories (person, activity, place, concept): Use patterns similar to ${JSON.stringify(this.categoryPatterns)} but intelligently extract unique relevant terms from the text.
        - For each unique term, create a node.
        - Intensity: 5
        - ID: "[category]-[lowercase-term]" (e.g., "person-mom")
        - Label: Capitalized term (e.g., "Mom")
        - Category: Matching category
      - Triggers: If negative emotions (anxiety, sadness, anger) are present, and they seem related to any activity, person, or concept nodes, change those nodes' category to "trigger" (instead of their original category).

      For all nodes:
      - Connections: Leave as empty array [] (will be calculated later)
      - Entries: Include only ["${entryId}"]

      Output ONLY a valid JSON array of node objects, nothing else. Example:
      [
        {"id": "emotion-anxiety", "label": "Anxiety", "category": "emotion", "intensity": 4, "connections": [], "entries": ["${entryId}"]},
        {"id": "person-mom", "label": "Mom", "category": "person", "intensity": 5, "connections": [], "entries": ["${entryId}"]}
      ]
    `;

    try {
      const result = await this.model.generateContent(prompt);
      let responseText = result.response.text();

      // Clean the response to extract valid JSON
      responseText = responseText.replace(/```json|```/g, '').trim();
      console.log('Cleaned Gemini API Response:', responseText);
      // Parse the cleaned response
      const extractedNodes: Omit<ThoughtNode, 'color'>[] = JSON.parse(responseText);

      // Assign colors based on category and subcategory
      const nodesWithColor: ThoughtNode[] = extractedNodes.map(node => {
        let color = '';
        if (node.category === 'emotion') {
          const subcat = node.label.toLowerCase();
          color = this.nodeColors.emotion[subcat as keyof typeof this.nodeColors.emotion] || 'bg-accent';
        } else if (node.category === 'trigger') {
          color = this.nodeColors.trigger;
        } else {
          color = this.nodeColors[node.category as keyof typeof this.nodeColors] as string;
        }
        return { ...node, color };
      });

      const nodeIds = nodesWithColor.map(n => n.id);

      const entry: ThoughtEntry = {
        id: entryId,
        text,
        timestamp: new Date(),
        nodes: nodeIds
      };

      return { nodes: nodesWithColor, entry };
    } catch (error) {
      console.error('Gemini API error:', error);
      // Fallback to keyword-based analysis
      return this.fallbackAnalyzeText(text, entryId);
    }
  }

  /**
   * Fallback method for keyword-based analysis, used if the Gemini API fails.
   * @param text The journal entry text to analyze.
   * @param entryId The ID of the journal entry.
   * @returns An object containing the extracted nodes and the entry.
   */
  private fallbackAnalyzeText(text: string, entryId: string): { nodes: ThoughtNode[], entry: ThoughtEntry } {
    const foundNodes: ThoughtNode[] = [];
    const nodeIds: string[] = [];
    const lowerText = text.toLowerCase();

    // Extract emotions
    Object.entries(this.emotionWords).forEach(([emotion, words]) => {
      const matches = words.filter(word => lowerText.includes(word));
      if (matches.length > 0) {
        const intensity = Math.min(matches.length * 2, 10);
        const nodeId = `emotion-${emotion}`;

        foundNodes.push({
          id: nodeId,
          label: emotion.charAt(0).toUpperCase() + emotion.slice(1),
          category: 'emotion',
          intensity,
          connections: [],
          color: this.nodeColors.emotion[emotion as keyof typeof this.nodeColors.emotion] || 'bg-accent',
          entries: [entryId]
        });
        nodeIds.push(nodeId);
      }
    });

    // Extract other categories
    Object.entries(this.categoryPatterns).forEach(([category, pattern]) => {
      const matches = text.match(pattern);
      if (matches) {
        const uniqueMatches = [...new Set(matches.map(m => m.toLowerCase()))];
        uniqueMatches.forEach(match => {
          const nodeId = `${category}-${match}`;
          foundNodes.push({
            id: nodeId,
            label: match.charAt(0).toUpperCase() + match.slice(1),
            category: category as ThoughtNode['category'],
            intensity: 5,
            connections: [],
            color: this.nodeColors[category as keyof typeof this.nodeColors] as string,
            entries: [entryId]
          });
          nodeIds.push(nodeId);
        });
      }
    });

    // Identify triggers
    const negativeEmotions = foundNodes.filter(n =>
      n.category === 'emotion' && ['anxiety', 'sadness', 'anger'].includes(n.label.toLowerCase())
    );

    if (negativeEmotions.length > 0) {
      const otherNodes = foundNodes.filter(n => n.category !== 'emotion');
      otherNodes.forEach(node => {
        if (node.category === 'activity' || node.category === 'concept' || node.category === 'person') {
          node.category = 'trigger';
          node.color = this.nodeColors.trigger;
        }
      });
    }

    const entry: ThoughtEntry = {
      id: entryId,
      text,
      timestamp: new Date(),
      nodes: nodeIds
    };

    return { nodes: foundNodes, entry };
  }

  /**
   * Merges a new set of nodes into an existing collection, updating connections and intensity.
   * @param existingNodes The array of nodes already in the graph.
   * @param newNodes The array of newly extracted nodes from a journal entry.
   * @returns The merged and updated array of nodes.
   */
  mergeNodes(existingNodes: ThoughtNode[], newNodes: ThoughtNode[]): ThoughtNode[] {
    const merged = [...existingNodes];

    newNodes.forEach(newNode => {
      const existingIndex = merged.findIndex(n => n.id === newNode.id);

      if (existingIndex >= 0) {
        // Update existing node
        const existing = merged[existingIndex];
        existing.intensity = Math.min(existing.intensity + 1, 15);
        existing.entries = [...new Set([...existing.entries, ...newNode.entries])];

        // Update category if it's now a trigger
        if (newNode.category === 'trigger' && existing.category !== 'emotion') {
          existing.category = 'trigger';
          existing.color = this.nodeColors.trigger;
        }
      } else {
        // Add new node
        merged.push(newNode);
      }
    });

    // Calculate connections based on co-occurrence in entries
    merged.forEach(node => {
      const connections: { id: string; strength: number }[] = []; // <-- This line is changed

      merged.forEach(otherNode => {
        if (node.id !== otherNode.id) {
          // Check if they appear together in any entries
          const sharedEntries = node.entries.filter(entryId =>
            otherNode.entries.includes(entryId)
          );

          if (sharedEntries.length > 0) {
            // Store the ID *and* the strength (number of shared entries)
            connections.push({ id: otherNode.id, strength: sharedEntries.length }); // <-- This line is changed
          }
        }
      });
      node.connections = connections;
    });

    return merged;
  }

  /**
   * Acts as an empathetic mental wellness guide, providing responses based on the user's graph data.
   * @param message The user's message.
   * @param graphContext An object containing the current nodes and entries.
   * @param chatHistory The history of the current chat session.
   * @returns A promise resolving to the AI's response text.
   */
  async chatWithGuide(
    message: string,
    graphContext: { nodes: ThoughtNode[]; entries: ThoughtEntry[] },
    chatHistory: { role: 'user' | 'assistant'; content: string }[]
  ): Promise<string> {
    const { nodes, entries } = graphContext;

    const contextSummary = `
      Current graph summary:
      - Nodes: ${nodes.map(n => `${n.label} (${n.category}, intensity: ${n.intensity})`).join(', ')}
      - Recent entries: ${entries.slice(-3).map(e => `"${e.text.slice(0, 100)}..."`).join('; ')}
      - Common connections: Negative emotions often link to work/people; positive to friends/activities.
    `;

    const seriousKeywords = ['depress', 'suicid', 'hopeless', 'self-harm', 'end my life'];
    const isSerious = seriousKeywords.some(keyword => message.toLowerCase().includes(keyword));

    const prompt = `
      You are an empathetic AI mental wellness guide. Respond to the user's message based on their journal graph.
      Graph context: ${contextSummary}

      Chat history: ${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

      User message: "${message}"

      Guidelines:
      - Analyze the graph if asked (e.g., "Most common trigger?" -> "Based on your nodes, 'work' triggers anxiety often").
      - Give positive, actionable advice (e.g., "Try journaling more about positive moments").
      - Keep responses concise (under 150 words), supportive, and non-clinical.
      - If the message mentions depression, suicide, or serious mental health issues, respond with empathy and provide helpline: "I'm here to listen, but for immediate help, call the National Suicide Prevention Lifeline at 988 (US) or visit https://findahelpline.com for global options. You're not alone."

      Output ONLY the response text, nothing else.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      let responseText = result.response.text().trim();

      // Fallback if Gemini doesn't handle serious topics
      if (isSerious) {
        responseText = "I'm here to listen, but for immediate help, call the National Suicide Prevention Lifeline at 988 (US) or visit https://findahelpline.com for global options. You're not alone.";
      }
      return responseText;
    } catch (error) {
      console.error('Chat Guide Error:', error);
      return `Sorry, I couldn't process that. Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}

export const thoughtAnalyzer = new ThoughtAnalyzer();