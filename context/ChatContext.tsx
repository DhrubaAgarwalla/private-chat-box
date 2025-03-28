"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Message, User } from '@/types';
import { supabase } from '@/lib/supabase';
import { generateUserId, generateRoomId } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface ChatContextType {
  messages: Message[];
  user: User;
  currentRoomId: string | null;
  isRoomCreator: boolean;
  isTyping: boolean;
  isLoading: boolean;
  setCurrentRoomId: (roomId: string) => void;
  sendMessage: (content: string, imageUrl?: string | null, voiceUrl?: string | null, videoUrl?: string | null) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  clearChat: () => Promise<void>;
  deleteRoom: () => Promise<void>;
  setIsTyping: (isTyping: boolean) => void;
  refreshMessages: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<User>({ id: '', name: null });
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Initialize user on first load
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    try {
      // Check if we have a user ID in local storage
      const storedUserId = localStorage.getItem('user_id');
      if (storedUserId) {
        setUser({ id: storedUserId, name: null });
      } else {
        // Generate a new user ID and store it
        const newUserId = generateUserId();
        localStorage.setItem('user_id', newUserId);
        setUser({ id: newUserId, name: null });
      }
    } catch (error) {
      console.error('Error initializing user:', error);
      // Fallback to a temporary user ID
      setUser({ id: generateUserId(), name: null });
    }
  }, []);

  // Fetch messages function that can be called repeatedly
  const fetchMessages = useCallback(async (showLoading = true) => {
    if (!currentRoomId) return;
    
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', currentRoomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Only update if we have new data or it's the initial load
      // Compare lengths and ids instead of full objects to avoid infinite loops
      const shouldUpdate = !lastFetchTime || 
        data?.length !== messages.length || 
        (data && messages.some((msg, i) => !data[i] || msg.id !== data[i].id));
      
      if (shouldUpdate) {
        setMessages(data || []);
      }
      
      setLastFetchTime(new Date());
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (showLoading) {
        toast.error('Failed to load messages');
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [currentRoomId, messages.length, lastFetchTime]);

  // Public refresh function that can be called from components
  const refreshMessages = useCallback(async () => {
    await fetchMessages(false);
  }, [fetchMessages]);

  // Update the useEffect that monitors room changes to check if the user is the creator
  useEffect(() => {
    if (!currentRoomId || !user?.id) return;
    
    setIsLoading(true);
    
    const fetchInitialMessages = async () => {
      await fetchMessages(true);
      setIsLoading(false);
    };
    
    // Check if user is the room creator
    const checkRoomCreator = async () => {
      try {
        const { data: room } = await supabase
          .from('rooms')
          .select('creator_id')
          .eq('id', currentRoomId)
          .single();
        
        // Set isRoomCreator based on if creator_id matches current user id
        setIsRoomCreator(room?.creator_id === user.id);
      } catch (error) {
        console.error('Error checking room creator:', error);
        setIsRoomCreator(false);
      }
    };
    
    createOrUpdateRoom();
    fetchInitialMessages();
    checkRoomCreator();
    
    // Set up polling for new messages
    const intervalId = setInterval(() => {
      if (currentRoomId) {
        fetchMessages(false);
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [currentRoomId, user?.id, fetchMessages]);

  // Create or update room function
  const createOrUpdateRoom = async () => {
    if (!currentRoomId || !user?.id) return;
    
    try {
      // Check if room exists
      const { data: existingRoom } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', currentRoomId)
        .single();
      
      const now = new Date().toISOString();
      
      if (existingRoom) {
        // Update last activity
        await supabase
          .from('rooms')
          .update({ last_activity: now })
          .eq('id', currentRoomId);
      } else {
        // Create new room with current user as creator
        await supabase.from('rooms').insert({
          id: currentRoomId,
          creator_id: user.id,
          created_at: now,
          last_activity: now
        });
        
        // User is creator for new rooms
        setIsRoomCreator(true);
      }
    } catch (error) {
      console.error('Error creating/updating room:', error);
    }
  };

  // Send a message
  const sendMessage = async (content: string, imageUrl: string | null = null, voiceUrl: string | null = null, videoUrl: string | null = null) => {
    if (!currentRoomId) return;
    
    let messageType: 'text' | 'image' | 'voice' | 'video' = 'text';
    
    if (imageUrl) {
      messageType = 'image';
    } else if (voiceUrl) {
      messageType = 'voice';
    } else if (videoUrl) {
      messageType = 'video';
    }
    
    // Create message object
    const newMessage: Partial<Message> = {
      id: uuidv4(),
      room_id: currentRoomId,
      content: content.trim(),
      sender_id: user.id,
      message_type: messageType,
      created_at: new Date().toISOString(),
    };
    
    // Add media URL if present
    if (imageUrl) {
      newMessage.image_url = imageUrl;
    } else if (voiceUrl) {
      newMessage.voice_url = voiceUrl;
    } else if (videoUrl) {
      newMessage.video_url = videoUrl;
    }
    
    // Optimistically add to UI
    setMessages(prev => [...prev, newMessage as Message]);
    
    try {
      // Create or update room to mark activity
      await createOrUpdateRoom();
      
      // Save message to Supabase
      const { error } = await supabase
        .from('messages')
        .insert(newMessage);
      
      if (error) throw error;
      
      // Clear typing indicator after sending
      setIsTyping(false);
      
      // Scroll to bottom (implemented elsewhere)
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the message if it failed to send
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
      toast.error('Failed to send message');
      throw error;
    }
  };

  // Delete a message
  const deleteMessage = async (messageId: string) => {
    try {
      // Store message for potential recovery
      const messageToDelete = messages.find(msg => msg.id === messageId);
      
      // Optimistically remove from UI
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      
      if (error) {
        // Add message back if error
        if (messageToDelete) {
          setMessages(prev => [...prev, messageToDelete]);
        }
        throw error;
      }
      
      // Fetch messages to ensure we have the latest state
      setTimeout(() => {
        fetchMessages(false);
      }, 500);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  // Clear all messages in a room
  const clearChat = async () => {
    if (!currentRoomId) return;

    try {
      // Store messages for potential recovery
      const currentMessages = [...messages];
      
      // Optimistically clear UI
      setMessages([]);
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('room_id', currentRoomId);
      
      if (error) {
        // Restore messages if error
        setMessages(currentMessages);
        throw error;
      }
      
      toast.success('Chat cleared');
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Failed to clear chat');
    }
  };

  // Handle room ID changes
  const handleSetCurrentRoomId = (roomId: string) => {
    if (roomId.trim() === '') {
      // User is leaving the room
      setCurrentRoomId(null);
      setMessages([]);
      return;
    }
    
    setCurrentRoomId(roomId);
  };

  // Delete a room and all its messages
  const deleteRoom = async () => {
    if (!currentRoomId || !isRoomCreator) return;

    try {
      // Store current state for potential recovery
      const currentMessages = [...messages];
      const roomToDelete = currentRoomId;
      
      // Optimistically clear UI and exit room
      setMessages([]);
      setCurrentRoomId(null);
      
      // Get all messages with images in this room
      const { data: messagesWithImages } = await supabase
        .from('messages')
        .select('image_url')
        .eq('room_id', roomToDelete)
        .not('image_url', 'is', null);

      // Delete images from storage
      if (messagesWithImages && messagesWithImages.length > 0) {
        const imagePaths = messagesWithImages
          .map(msg => msg.image_url)
          .filter(url => url)
          .map(url => url.split('/').pop()); // Extract filename from URL

        await supabase.storage
          .from('chat-images')
          .remove(imagePaths);
      }
      
      // Get all messages with voice recordings in this room
      const { data: messagesWithVoice } = await supabase
        .from('messages')
        .select('voice_url')
        .eq('room_id', roomToDelete)
        .not('voice_url', 'is', null);

      // Delete voice recordings from storage
      if (messagesWithVoice && messagesWithVoice.length > 0) {
        const voicePaths = messagesWithVoice
          .map(msg => msg.voice_url)
          .filter(url => url)
          .map(url => url.split('/').pop()); // Extract filename from URL

        await supabase.storage
          .from('voice-messages')
          .remove(voicePaths);
      }
      
      // Get all messages with videos in this room
      const { data: messagesWithVideos } = await supabase
        .from('messages')
        .select('video_url')
        .eq('room_id', roomToDelete)
        .not('video_url', 'is', null);

      // Delete videos from storage
      if (messagesWithVideos && messagesWithVideos.length > 0) {
        const videoPaths = messagesWithVideos
          .map(msg => msg.video_url)
          .filter(url => url)
          .map(url => url.split('/').pop()); // Extract filename from URL

        await supabase.storage
          .from('video-messages')
          .remove(videoPaths);
      }
      
      // Delete all messages in the room
      await supabase
        .from('messages')
        .delete()
        .eq('room_id', roomToDelete);
      
      // Delete the room itself
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomToDelete);
      
      if (error) throw error;
      
      toast.success('Room deleted successfully');
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete room');
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        user,
        currentRoomId,
        isRoomCreator,
        isTyping,
        isLoading,
        setCurrentRoomId: handleSetCurrentRoomId,
        sendMessage,
        deleteMessage,
        clearChat,
        deleteRoom,
        setIsTyping,
        refreshMessages
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 