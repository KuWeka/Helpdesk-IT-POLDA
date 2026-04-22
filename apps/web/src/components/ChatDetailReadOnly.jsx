
import React from 'react';
import { Card } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { ArrowLeft, User, ShieldAlert, Trash2 } from 'lucide-react';
import ChatMessage from '@/components/ChatMessage.jsx';
import { format } from 'date-fns';

const safeFormatDate = (value, pattern = 'dd MMM HH:mm') => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, pattern);
};

export default function ChatDetailReadOnly({ chat, messages, onBack, onDelete }) {
  return (
    <Card className="flex-1 flex flex-col border-border shadow-sm overflow-hidden bg-background h-full max-h-[70vh]">
      <div className="p-4 border-b bg-card flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 hover:bg-background">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-foreground">Detail Chat #{chat.id.slice(0, 8)}</h2>
              <Badge variant={chat.status === 'Open' ? 'default' : 'secondary'}>{chat.status}</Badge>
            </div>
            <div className="text-xs text-muted-foreground flex gap-4 mt-1">
              <span className="flex items-center gap-1"><User className="h-3 w-3" /> Pelapor: {chat.user_name || 'Unknown'}</span>
              <span className="flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Teknisi: {chat.tech_name || 'Belum ada'}</span>
            </div>
          </div>
        </div>
        <div className="text-right flex items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Terkait Tiket:</p>
            <p className="font-mono text-sm font-semibold">{chat.ticket_number || '-'}</p>
          </div>
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={() => onDelete(chat.id)} className="gap-2">
              <Trash2 className="h-4 w-4" /> Hapus Chat
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Belum ada pesan dalam chat ini.
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={{
                ...msg,
                created_at: msg.created_at || msg.created,
                is_read: true,
              }}
              isOwnMessage={msg.sender_role === 'Teknisi' || msg.sender_role === 'Admin'}
            />
          ))
        )}
      </div>
    </Card>
  );
}
