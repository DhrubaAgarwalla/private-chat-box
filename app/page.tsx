"use client";

import ChatLayout from "@/components/ChatLayout";
import { useChat } from "@/context/ChatContext";
import { ChatHeader } from "@/components/ChatHeader";
import dynamic from "next/dynamic";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 max-w-5xl mx-auto">
      <div className="w-full h-full flex flex-col rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <ClientHome />
      </div>
    </main>
  );
}

function ClientHome() {
  const { currentRoomId } = useChat();

  return (
    <>
      {currentRoomId ? (
        <>
          <ChatHeader />
          <ChatLayout />
        </>
      ) : (
        <ClientRoomSelector />
      )}
    </>
  );
}

// Wrap the import in a client component
function ClientRoomSelector() {
  const RoomEntry = dynamic(() => import("@/components/RoomEntry"), {
    ssr: false,
  });
  
  return <RoomEntry />;
}
