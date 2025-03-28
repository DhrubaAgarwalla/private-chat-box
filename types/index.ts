export interface Message {
  id: string;
  room_id: string;
  content: string;
  sender_id: string;
  created_at: string;
  image_url?: string | null;
  voice_url?: string | null;
  video_url?: string | null;
  message_type: 'text' | 'image' | 'voice' | 'video';
}

export interface Room {
  id: string;
  creator_id: string;
  created_at: string;
  last_activity: string;
}

export interface User {
  id: string;
  name: string | null;
}

export interface CallStatus {
  inProgress: boolean;
  peer?: any;
  stream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  initiator: boolean;
  receiverId?: string | null;
  error?: string | null;
}

export interface VideoCallData {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-ended' | 'call-rejected';
  sender: string;
  receiver: string;
  roomId: string;
  payload?: any;
} 