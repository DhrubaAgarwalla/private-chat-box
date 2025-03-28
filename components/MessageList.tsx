"use client";

import { useRef, useEffect, useState, useCallback } from 'react';
import { useChat } from '@/context/ChatContext';
import MessageBubble from './MessageBubble';
import { FaKeyboard, FaSpinner, FaWifi, FaExclamationTriangle, FaSyncAlt } from 'react-icons/fa';

export default function MessageList() {
  const { messages, isTyping, currentRoomId, isLoading, refreshMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);

  // Check connection status periodically - memoized callback
  const checkConnection = useCallback(() => {
    if (navigator.onLine) {
      if (!isConnected) {
        setIsReconnecting(true);
        setTimeout(() => {
          setIsConnected(true);
          setIsReconnecting(false);
        }, 1500);
      }
    } else {
      setIsConnected(false);
    }
  }, [isConnected]);

  // Connection effect
  useEffect(() => {
    if (!currentRoomId) return;

    checkConnection();
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', () => setIsConnected(false));

    const intervalId = setInterval(checkConnection, 10000);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', () => setIsConnected(false));
      clearInterval(intervalId);
    };
  }, [currentRoomId, checkConnection]);

  // Only show loading indicator if it takes more than 800ms
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isLoading && !isManualRefreshing) {
      timer = setTimeout(() => {
        setShowRefreshIndicator(true);
      }, 800);
    } else {
      setShowRefreshIndicator(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, isManualRefreshing]);

  // Scroll to the bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleManualRefresh = async () => {
    if (isManualRefreshing) return;
    
    setIsManualRefreshing(true);
    setShowRefreshIndicator(true);
    await refreshMessages();
    setTimeout(() => {
      setIsManualRefreshing(false);
      setShowRefreshIndicator(false);
    }, 1000);
  };

  if (!currentRoomId) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <p className="text-gray-500 text-center px-4">Join or create a room to start chatting</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col message-container">
      {/* Status bar - fixed height */}
      <div className="flex-none">
        {/* Connection status indicator */}
        {!isConnected && (
          <div className="bg-red-100 text-red-800 p-2 rounded-md flex items-center justify-center gap-2 mb-2">
            <FaExclamationTriangle />
            <span>You are offline. Messages will be sent when you reconnect.</span>
          </div>
        )}
        
        {isReconnecting && (
          <div className="bg-yellow-100 text-yellow-800 p-2 rounded-md flex items-center justify-center gap-2 mb-2">
            <FaSpinner className="animate-spin" />
            <span>Reconnecting...</span>
          </div>
        )}
        
        <div className="bg-gray-100 rounded-md flex items-center justify-between p-1 mb-2">
          <div className="text-xs flex items-center gap-1 text-gray-600">
            {isConnected ? (
              <>
                <FaWifi className="text-green-500" /> 
                <span>Connected</span>
                {showRefreshIndicator && <FaSpinner className="animate-spin h-3 w-3 ml-1 text-gray-400" />}
              </>
            ) : (
              <><FaExclamationTriangle className="text-red-500" /> <span>Offline</span></>
            )}
          </div>
          
          <button 
            onClick={handleManualRefresh}
            disabled={isManualRefreshing || isLoading || !isConnected}
            className="flex items-center gap-1 text-xs p-1 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Refresh messages"
          >
            {isManualRefreshing ? (
              <><FaSpinner className="animate-spin h-3 w-3" /> <span>Refreshing...</span></>
            ) : (
              <><FaSyncAlt className="h-3 w-3" /> <span>Refresh</span></>
            )}
          </button>
        </div>
      </div>
      
      {/* Messages container - scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            {isLoading && showRefreshIndicator ? (
              <div className="flex flex-col items-center gap-2">
                <FaSpinner className="animate-spin h-6 w-6 text-blue-500" />
                <p className="text-gray-500">Loading messages...</p>
              </div>
            ) : (
              <p className="text-gray-500 text-center">No messages yet. Start chatting!</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}
        
        {/* Element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Typing indicator - fixed height */}
      <div className="flex-none p-1">
        {isTyping && (
          <div className="flex items-center gap-2 text-gray-500">
            <FaKeyboard className="h-4 w-4" />
            <span className="text-sm">Someone is typing...</span>
          </div>
        )}
      </div>
    </div>
  );
} 