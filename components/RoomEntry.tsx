"use client";

import { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { generateRoomId, isValidRoomId } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { FaKey, FaCopy, FaRandom, FaDoorOpen, FaTrash } from 'react-icons/fa';

export default function RoomEntry() {
  const [roomInput, setRoomInput] = useState('');
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { setCurrentRoomId, currentRoomId, isRoomCreator, deleteRoom } = useChat();

  const handleGenerateRoom = () => {
    const newRoomId = generateRoomId();
    setRoomInput(newRoomId);
  };

  const handleCopyRoomId = () => {
    if (!currentRoomId) return;
    
    try {
      // Use fallback copy method if navigator.clipboard is not available
      const textArea = document.createElement('textarea');
      textArea.value = currentRoomId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
      toast.success('Room ID copied to clipboard');
    } catch (error) {
      console.error('Failed to copy text: ', error);
      toast.error('Failed to copy room ID');
    }
  };

  const handleJoinRoom = () => {
    if (!roomInput.trim()) {
      toast.error('Please enter a room ID');
      return;
    }

    if (!isValidRoomId(roomInput)) {
      toast.error('Invalid room ID format');
      return;
    }

    setCurrentRoomId(roomInput);
    toast.success(`Joined room: ${roomInput}`);
  };

  const handleDeleteRoomClick = () => {
    if (showDeleteConfirm) {
      // Call the deleteRoom function
      deleteRoom();
      setShowDeleteConfirm(false);
    } else {
      // Show confirmation
      setShowDeleteConfirm(true);
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowDeleteConfirm(false);
      }, 5000);
    }
  };

  return (
    <div className="p-4 border-b border-gray-200">
      {currentRoomId ? (
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Current Room</h2>
            <div className="flex gap-2">
              {isRoomCreator && (
                <button
                  onClick={handleDeleteRoomClick}
                  className={`p-2 text-red-500 hover:text-red-700 transition-colors ${
                    showDeleteConfirm ? 'bg-red-100 rounded' : ''
                  }`}
                  title={showDeleteConfirm ? "Confirm delete room" : "Delete room (creator only)"}
                >
                  <FaTrash className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => setCurrentRoomId('')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Leave room"
              >
                <FaDoorOpen className="h-5 w-5" />
              </button>
            </div>
          </div>
          {showDeleteConfirm && (
            <div className="bg-red-100 text-red-800 p-2 rounded-md mb-2 text-sm">
              Are you sure you want to delete this room? This will delete all messages and the room itself.
              Click the delete button again to confirm.
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 px-3 py-2 rounded flex-1 font-mono text-sm overflow-x-auto whitespace-nowrap">
              {currentRoomId}
            </div>
            <button
              onClick={handleCopyRoomId}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              title="Copy room ID"
            >
              <FaCopy className="h-5 w-5" />
            </button>
          </div>
          {showCopiedMessage && (
            <span className="text-green-500 text-sm mt-1">Copied!</span>
          )}
        </div>
      ) : (
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Join a Room</h2>
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FaKey className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                placeholder="Enter room ID"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleGenerateRoom}
              className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              title="Generate random room ID"
            >
              <FaRandom className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={handleJoinRoom}
            className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Join / Create Room
          </button>
        </div>
      )}
    </div>
  );
} 