import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { http } from "@/lib/api";

interface ChatMessage {
  role: "user" | "ai" | "system";
  content: string;
}

export function GlobalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  async function handleSend() {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput("");
    
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const res = await http<{ success: boolean; reply: string; error?: string }>("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userMsg,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      
      if (res.reply) {
        setMessages(prev => [...prev, { role: "ai", content: res.reply }]);
      } else if (res.error) {
        setMessages(prev => [...prev, { role: "system", content: "Error: " + res.error }]);
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to reach AI assistant.";
      setMessages(prev => [...prev, { role: "system", content: msg }]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50"
          size="icon"
        >
          <MessageSquare className="h-6 w-6 text-primary-foreground" />
        </Button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 flex flex-col w-[350px] sm:w-[400px] h-[500px] max-h-[calc(100vh-100px)] bg-background border rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MessageSquare className="size-4" />
              FinSight Assistant
            </h3>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground" onClick={() => setIsOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground mt-10">
                Hi! I'm the FinSight assistant. How can I help you navigate the platform today?
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>
                <div className="prose prose-sm dark:prose-invert">
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="chat-bubble-ai">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="p-3 bg-background border-t">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about FinSight features..."
                value={input}
                onChange={e => setInput(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isTyping}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
