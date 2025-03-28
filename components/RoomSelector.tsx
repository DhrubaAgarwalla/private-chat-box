"use client";

import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { generateRoomId } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export function RoomSelector() {
  const { setCurrentRoomId } = useChat();
  const [roomId, setRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) {
      toast.error('Please enter a room ID');
      return;
    }

    setIsJoining(true);
    try {
      setCurrentRoomId(roomId.trim());
      toast.success('Joined room successfully');
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateRoom = () => {
    setIsCreating(true);
    try {
      const newRoomId = generateRoomId();
      setCurrentRoomId(newRoomId);
      toast.success('Created new room');
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Message Box</h1>
        <p className="text-gray-600 text-center mb-8">
          Secure, real-time private chat with unique room IDs
        </p>

        <form onSubmit={handleJoinRoom} className="mb-6">
          <div className="mb-4">
            <label
              htmlFor="roomId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Room ID
            </label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isJoining}
            className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {isJoining ? 'Joining...' : 'Join Room'}
          </button>
        </form>

        <div className="flex items-center justify-between mb-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink px-4 text-gray-500 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button
          onClick={handleCreateRoom}
          disabled={isCreating}
          className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        >
          {isCreating ? 'Creating...' : 'Create New Room'}
        </button>
      </div>
    </div>
  );
}