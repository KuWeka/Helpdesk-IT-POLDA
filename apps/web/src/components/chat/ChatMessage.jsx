
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { format } from 'date-fns';

export default function ChatMessage({ message, isOwnMessage }) {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return format(date, 'HH:mm');
  };

  const senderName = message.sender_name || (isOwnMessage ? 'Anda' : 'Teknisi');
  const senderRole = message.sender_role || (isOwnMessage ? 'Anda' : 'Pengguna');
  const messageContent = message.message_content || message.content || '';
  const timestamp = message.created_at || message.created || message.timestamp;
  const isRead = Boolean(message.is_read || message.read_at);

  return (
    <div className={cn('mb-4 flex w-full gap-3', isOwnMessage ? 'flex-row-reverse justify-start' : 'justify-start')}>
      <Avatar className="mt-0.5 size-8 shrink-0">
        <AvatarImage src={message.sender_avatar} alt={senderName} />
        <AvatarFallback className="text-xs">
          {senderName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className={cn('flex max-w-[85%] flex-col md:max-w-[70%]', isOwnMessage ? 'items-end' : 'items-start')}>
        {!isOwnMessage && (
          <div className="mb-1 flex items-center gap-2 px-1">
            <span className="text-xs font-semibold text-foreground">
              {senderName}
            </span>
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {senderRole}
            </span>
          </div>
        )}

        <div
          className={cn(
            'rounded-2xl border px-4 py-3 shadow-sm',
            isOwnMessage
              ? 'rounded-tr-sm border-primary/20 bg-primary text-primary-foreground'
              : 'rounded-tl-sm border-border bg-muted text-foreground'
          )}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {messageContent}
          </p>
        </div>

        <div className={cn('mt-1 flex items-center gap-1 px-1 text-xs', isOwnMessage ? 'text-primary/80' : 'text-muted-foreground')}>
          <span>{formatTime(timestamp)}</span>
          {isOwnMessage && (
            isRead ? (
              <CheckCheck className="size-3.5 text-green-600" title="Telah dibaca" />
            ) : (
              <Check className="size-3.5 opacity-80" title="Terkirim" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
