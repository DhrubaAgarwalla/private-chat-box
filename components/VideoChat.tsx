"use client";

import { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { io, Socket } from 'socket.io-client';
import { useChat } from '@/context/ChatContext';
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

interface VideoChatProps {
  roomId: string;
}

export default function VideoChat({ roomId }: VideoChatProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  
  const myVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const { currentRoomId } = useChat();

  useEffect(() => {
    // Connect to signaling server
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');

    // Request camera and microphone permissions
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    .then(currentStream => {
      setStream(currentStream);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }
    });

    return () => {
      // Cleanup
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (peer) {
        peer.destroy();
      }
    };
  }, []);

  const startCall = () => {
    if (!stream || !socketRef.current) return;

    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream
    });

    peer.on('signal', data => {
      socketRef.current?.emit('callUser', {
        userToCall: roomId,
        signalData: data,
        from: currentRoomId
      });
    });

    peer.on('stream', remoteStream => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = remoteStream;
      }
    });

    socketRef.current.on('callAccepted', signal => {
      peer.signal(signal);
      setIsCallActive(true);
    });

    setPeer(peer);
  };

  const answerCall = (incomingSignal: any) => {
    if (!stream || !socketRef.current) return;

    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream
    });

    peer.on('signal', data => {
      socketRef.current?.emit('answerCall', { signal: data, to: roomId });
    });

    peer.on('stream', remoteStream => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = remoteStream;
      }
    });

    peer.signal(incomingSignal);
    setPeer(peer);
    setIsCallActive(true);
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioOn(!isAudioOn);
    }
  };

  const endCall = () => {
    if (peer) {
      peer.destroy();
    }
    setIsCallActive(false);
  };

  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on('callUser', ({ from, signal }) => {
      // Handle incoming call
      answerCall(signal);
    });
  }, [socketRef.current]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative grid grid-cols-2 gap-4 p-4">
        {/* My Video */}
        <div className="relative">
          <video
            ref={myVideo}
            autoPlay
            muted
            playsInline
            className="w-full rounded-lg bg-gray-900"
          />
          <div className="absolute bottom-4 left-4 flex space-x-2">
            <button
              onClick={toggleVideo}
              className={`p-2 rounded-full ${
                isVideoOn ? 'bg-blue-500' : 'bg-red-500'
              } text-white`}
            >
              {isVideoOn ? <FaVideo /> : <FaVideoSlash />}
            </button>
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-full ${
                isAudioOn ? 'bg-blue-500' : 'bg-red-500'
              } text-white`}
            >
              {isAudioOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
            </button>
          </div>
        </div>

        {/* Remote Video */}
        <div className="relative">
          <video
            ref={remoteVideo}
            autoPlay
            playsInline
            className="w-full rounded-lg bg-gray-900"
          />
        </div>
      </div>

      <div className="mt-4 flex space-x-4">
        {!isCallActive ? (
          <button
            onClick={startCall}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Start Call
          </button>
        ) : (
          <button
            onClick={endCall}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            End Call
          </button>
        )}
      </div>
    </div>
  );
} 