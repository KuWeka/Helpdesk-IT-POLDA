
import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Send, Lock } from 'lucide-react';

export default function MessageInput({ onSend, disabled, isClosed, onTypingChange }) {
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const nextMessage = e.target.value;
    setMessage(nextMessage);
    onTypingChange?.(nextMessage.trim().length > 0);
  };

  const handleSend = () => {
    if (message.trim() && !disabled && !isClosed) {
      onSend(message.trim());
      setMessage('');
      onTypingChange?.(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isClosed) {
    return (
      <div className="p-4 bg-muted/30 border-t flex flex-col items-center justify-center text-muted-foreground gap-2">
        <Lock className="h-5 w-5" />
        <p className="text-sm font-medium">Chat ini telah ditutup</p>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 p-4 border-t bg-background">
      <Textarea
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Ketik pesan..."
        rows={1}
        className="min-h-[40px] max-h-[120px] resize-none flex-1"
        disabled={disabled}
      />
      <Button 
        onClick={handleSend} 
        disabled={!message.trim() || disabled}
        size="icon"
        className="h-10 w-10 shrink-0"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Kirim pesan</span>
      </Button>
    </div>
  );
}
