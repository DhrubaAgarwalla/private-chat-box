"use client";

import React from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChat } from '@/context/ChatContext';

export function Chat() {
  const { currentRoomId } = useChat();

  if (!currentRoomId) {
    return null;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-hidden">
        <MessageList />
      </div>
      <div className="flex-none">
        <MessageInput />
      </div>
    </div>
  );
} 