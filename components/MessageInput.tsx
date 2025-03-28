"use client";

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { FaPaperPlane, FaRegTrashAlt, FaVideo } from 'react-icons/fa';
import ImageUpload from './ImageUpload';
import VoiceRecorder from './VoiceRecorder';
import VideoUpload from './VideoUpload';
import { toast } from 'react-hot-toast';

export default function MessageInput() {
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const { sendMessage, currentRoomId, setIsTyping } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Focus the input when a room is joined
    if (currentRoomId && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentRoomId]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Set typing indicator
    setIsTyping(!!e.target.value);
    
    // Clear typing indicator after 2 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't send empty messages without media
    if ((!message.trim() && !imageUrl && !videoUrl) || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await sendMessage(message, imageUrl, null, videoUrl);
      setMessage('');
      setImageUrl(null);
      setVideoUrl(null);
      setIsTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSubmitting(false);
      // Focus the input after sending
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleVoiceMessageSend = async (voiceUrl: string) => {
    if (!currentRoomId) return;

    try {
      await sendMessage('', null, voiceUrl);
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast.error('Failed to send voice message');
    }
  };

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
  };

  const handleVideoUpload = (url: string) => {
    setVideoUrl(url);
  };

  const handleVideoClick = () => {
    if (videoInputRef.current) {
      videoInputRef.current.click();
    }
  };

  const clearImageUrl = () => {
    setImageUrl(null);
  };

  if (!currentRoomId) return null;

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] max-h-[200px] overflow-y-auto resize-none"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <ImageUpload onImageUpload={handleImageUpload} />
          <VoiceRecorder onVoiceMessageSend={handleVoiceMessageSend} />
          <VideoUpload onUploadComplete={handleVideoUpload} />
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!message.trim() && !imageUrl && !videoUrl)}
            className={`p-2 rounded-full ${
              isSubmitting || (!message.trim() && !imageUrl && !videoUrl)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            } transition-colors`}
            title="Send message"
          >
            <FaPaperPlane className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {isLoading && <div className="mt-2 text-sm text-gray-500">Uploading media...</div>}
      
      {imageUrl && (
        <div className="mt-2 relative w-40 h-40">
          <img
            src={imageUrl}
            alt="Upload preview"
            className="w-full h-full object-cover rounded-md"
          />
          <button
            onClick={clearImageUrl}
            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75"
          >
            <FaRegTrashAlt className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
} 