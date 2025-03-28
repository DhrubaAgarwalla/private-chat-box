import { ChevronLeft, UserIcon } from "lucide-react";
import { useChat } from "@/context/ChatContext";

export function ChatHeader() {
  const { currentRoomId, setCurrentRoomId } = useChat();

  const handleLeaveRoom = () => {
    setCurrentRoomId("");
  };

  return (
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
    </div>
  );
} 