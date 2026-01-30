import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Send } from "lucide-react";
import { ThoughtNode, ThoughtEntry, thoughtAnalyzer } from "./ThoughtAnalyzer";
import TextareaAutosize from "react-textarea-autosize";
import { useAuth } from "@/context/AuthContext";
import { fetchChatHistory, logChatMessage } from "@/lib/db";

interface ChatGuideProps {
  graphContext: { nodes: ThoughtNode[]; entries: ThoughtEntry[] };
}

const ChatGuide = ({ graphContext }: ChatGuideProps) => {
  type ChatMessage = { role: 'user' | 'assistant'; content: string };
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I'm your AI wellness guide. Ask about your mind graph or for advice." },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const { user } = useAuth();

  useEffect(() => {
    // Load history
    if (user) {
      fetchChatHistory(user.uid).then(history => {
        console.log("Chat history fetched:", history);
        if (history && history.length > 0) {
          setMessages(history);
        }
      });
    }
    scrollToBottom();
  }, [user]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user' as const, content: input };
    const newMessages: ChatMessage[] = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    if (user) {
      logChatMessage(user.uid, input, 'user');
    }

    try {
      const response = await thoughtAnalyzer.chatWithGuide(input, graphContext, newMessages);
      const assistantMsg = { role: 'assistant' as const, content: response };
      setMessages([...newMessages, assistantMsg]);

      if (user) {
        logChatMessage(user.uid, response, 'assistant');
      }
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: "Sorry, something went wrong. Try again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="card-neural p-6 space-y-4">
      <h3 className="text-xl font-semibold">Chat with your AI companion, <span className="italic">Meliora</span></h3>
      <h6 className="text-l font-semibold italic">Towards Better Things...</h6>
      <div className="h-64 overflow-y-auto space-y-4 pr-4 border border-border/50 rounded-lg p-4 bg-background/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3/4 p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2">
        <TextareaAutosize
          minRows={2}
          maxRows={5}
          placeholder="Ask about your graph or for advice..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          className="flex-1 bg-background/50 border-border/50 focus:border-primary/50"
          disabled={isLoading}
        />
        <Button onClick={handleSend} disabled={isLoading}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

export default ChatGuide;