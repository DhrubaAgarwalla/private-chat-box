"use client";

import React, { memo, useState, useEffect } from 'react';
import { Message } from '@/types';
import { useChat } from '@/context/ChatContext';
import { formatTimestamp } from '@/lib/utils';
import { FaTrash } from 'react-icons/fa';
import VoicePlayer from './VoicePlayer';
import VideoPlayer from './VideoPlayer';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  const { user, deleteMessage } = useChat();
  const [isClient, setIsClient] = useState(false);
  const [formattedTime, setFormattedTime] = useState('');
  
  // Determine if message is from current user - defer to client side
  const isCurrentUser = isClient ? message.sender_id === user.id : false;

  // Set up client-side effects after hydration
  useEffect(() => {
    setIsClient(true);
    setFormattedTime(formatTimestamp(message.created_at));
  }, [message.created_at]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentUser) {
      if (confirm('Are you sure you want to delete this message?')) {
        deleteMessage(message.id);
      }
    }
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] rounded-lg p-3 ${
        isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
      }`}>
        {message.message_type === 'text' && (
          <p className="message-content">{message.content}</p>
        )}
        
        {message.message_type === 'image' && message.image_url && (
          <img
            src={message.image_url}
            alt="Shared image"
            className="max-w-full rounded-lg"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/image-error.png'; // You might want to add a fallback image
            }}
          />
        )}

        {message.message_type === 'voice' && message.voice_url && (
          <VoicePlayer url={message.voice_url} />
        )}
        
        {message.message_type === 'video' && message.video_url && (
          <VideoPlayer url={message.video_url} />
        )}

        <div className="mt-1 text-xs opacity-75">
          {formattedTime}
        </div>
        
        {isClient && (
          <div className="flex justify-end items-center mt-1">
            {isCurrentUser && (
              <button
                onClick={handleDelete}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Delete message"
              >
                <FaTrash className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default MessageBubble; 