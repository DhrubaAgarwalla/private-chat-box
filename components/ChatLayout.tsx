"use client";

import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function ChatLayout() {
  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto overflow-hidden bg-white">
      <div className="flex-1 overflow-hidden">
        <MessageList />
      </div>
      <div className="flex-none">
        <MessageInput />
      </div>
    </div>
  );
} 