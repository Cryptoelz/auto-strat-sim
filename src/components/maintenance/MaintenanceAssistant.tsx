import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, Sparkles } from 'lucide-react';
import { answerMaintenanceQuestion, MAINTENANCE_SUGGESTIONS } from '@/lib/maintenance';

interface Msg { role: 'user' | 'assistant'; text: string }

export function MaintenanceAssistant() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', text: 'I am the ATLAS AI Maintenance assistant. I monitor every module, workflow, governance rule and performance budget on the platform. Ask me anything about the institution\'s health.' },
  ]);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const ask = (q: string) => {
    if (!q.trim()) return;
    setMessages((m) => [...m, { role: 'user', text: q }, { role: 'assistant', text: answerMaintenanceQuestion(q) }]);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <Card className="border-trading-gold/25">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bot className="h-4 w-4 text-trading-gold" />
          AI Maintenance Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-80 space-y-3 overflow-y-auto rounded-lg border border-border/50 bg-muted/10 p-3">
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-xs ${m.role === 'user' ? 'bg-primary/15 text-foreground' : 'border border-border/50 bg-card/60 text-muted-foreground'}`}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MAINTENANCE_SUGGESTIONS.map((s) => (
            <Button key={s} variant="outline" size="sm" className="h-6 gap-1 px-2 text-[10px]" onClick={() => ask(s)}>
              <Sparkles className="h-3 w-3 text-trading-gold" />
              {s}
            </Button>
          ))}
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
          <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about health, modules, repairs, warnings, performance…" className="h-8 text-xs" />
          <Button type="submit" size="sm" className="h-8"><Send className="h-3.5 w-3.5" /></Button>
        </form>
      </CardContent>
    </Card>
  );
}
