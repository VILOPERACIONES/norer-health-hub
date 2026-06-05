interface ChatBubbleProps {
  message: string;
  sender: 'user' | 'eyder';
  timestamp: Date;
  error?: boolean;
}

export function ChatBubble({ message, sender, timestamp, error }: ChatBubbleProps) {
  const isUser = sender === 'user';

  const timeStr = timestamp.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isUser && (
          <span className="text-[10px] text-[#888] px-1">Eyder · IA</span>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-[#1e1e1e] text-[#f0f0f0] rounded-br-sm'
              : error
              ? 'bg-[#2a1515] text-[#f87171] border border-[#3a1515] rounded-bl-sm'
              : 'bg-[#141414] text-[#d4d4d4] border border-[#2a2a2a] rounded-bl-sm'
          }`}
        >
          {message}
        </div>
        <span className="text-[10px] text-[#555] px-1">{timeStr}</span>
      </div>
    </div>
  );
}
