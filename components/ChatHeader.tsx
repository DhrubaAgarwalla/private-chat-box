import { ChevronLeft, UserIcon, Video } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { useState } from "react";
import VideoChat from "./video-chat";

export function ChatHeader() {
  const { currentRoomId, setCurrentRoomId } = useChat();
  const [showVideoChat, setShowVideoChat] = useState(false);

  const handleLeaveRoom = () => {
    setCurrentRoomId("");
  };

  const toggleVideoChat = () => {
    setShowVideoChat(!showVideoChat);
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 h-16">
        <div className="flex items-center">
          <button
            onClick={handleLeaveRoom}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-semibold flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {currentRoomId ? `Room #${currentRoomId.substring(0, 6)}` : "Chat"}
          </h2>
        </div>
        {currentRoomId && (
          <button
            onClick={toggleVideoChat}
            className={`p-2 rounded-full ${
              showVideoChat ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
            } transition-colors`}
            title="Video Call"
          >
            <Video className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {showVideoChat && currentRoomId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-4xl">
            <div className="flex justify-end mb-4">
              <button
                onClick={toggleVideoChat}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>
            <VideoChat roomId={currentRoomId} />
          </div>
        </div>
      )}
    </>
  );
} 