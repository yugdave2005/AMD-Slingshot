import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Type, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ThoughtInputProps {
  onAddEntry: (text: string) => void;
  isAnalyzing: boolean;
}

const ThoughtInput = ({ onAddEntry, isAnalyzing }: ThoughtInputProps) => {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const { toast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser. Please use Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      toast({
        title: "Listening...",
        description: "Speak clearly into your microphone.",
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setInputText(prev => {
          const newText = (prev + ' ' + finalTranscript).trim();
          // Capitalize first letter if it's the start
          return newText.charAt(0).toUpperCase() + newText.slice(1);
        });
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to use speech-to-text.",
          variant: "destructive",
        });
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      toast({
        title: "Recording Stopped",
        description: "Your thought has been captured.",
      });
    }
  };

  const handleSubmit = () => {
    if (!inputText.trim()) {
      toast({
        title: "Empty input",
        description: "Please write something or record a voice note first.",
        variant: "destructive",
      });
      return;
    }

    onAddEntry(inputText.trim());
    setInputText("");
  };

  return (
    <Card className="card-neural p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Pour Your Thoughts</h3>
        <div className="flex gap-2">
          <Button
            variant={inputMode === "text" ? "glass" : "outline"}
            size="sm"
            onClick={() => setInputMode("text")}
            className="flex items-center gap-2"
          >
            <Type className="w-4 h-4" />
            Write
          </Button>
          <Button
            variant={inputMode === "voice" ? "glass" : "outline"}
            size="sm"
            onClick={() => setInputMode("voice")}
            className="flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            Speak
          </Button>
        </div>
      </div>

      {inputMode === "text" ? (
        <Textarea
          placeholder="Let your thoughts flow freely... What's on your mind? How are you feeling? What patterns do you notice in your day?"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="min-h-32 bg-background/50 border-border/50 focus:border-primary/50"
          disabled={isAnalyzing}
        />
      ) : (
        <div className="flex flex-col items-center space-y-4 py-8">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-destructive shadow-glow neural-pulse' : 'bg-primary'
            }`}>
            {isRecording ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </div>

          {isRecording ? (
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">Recording...</p>
              <p className="text-sm text-muted-foreground">Speak freely about your thoughts and feelings</p>
              <Button variant="destructive" onClick={stopRecording} className="mt-4">
                Stop Recording
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">Ready to listen</p>
              <p className="text-sm text-muted-foreground">Click to start recording your voice</p>
              <Button variant="glass" onClick={startRecording} className="mt-4">
                Start Recording
              </Button>
            </div>
          )}
        </div>
      )}

      {inputText && (
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isAnalyzing ? "Analyzing..." : "Weave Thoughts"}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ThoughtInput;