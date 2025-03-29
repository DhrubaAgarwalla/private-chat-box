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
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const myVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const { currentRoomId } = useChat();

  // Initialize socket connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    console.log('Connecting to socket server:', socketUrl);
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
      upgrade: false
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      socketRef.current?.emit('joinRoom', roomId);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to video chat server');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  // Initialize media stream
  useEffect(() => {
    if (!socketRef.current?.connected) return;

    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    .then(currentStream => {
      console.log('Got media stream');
      setStream(currentStream);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }
      setIsInitialized(true);
    })
    .catch(err => {
      console.error('Error accessing media devices:', err);
      setError('Failed to access camera and microphone. Please check your permissions.');
    });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [socketRef.current?.connected]);

  // Set up call event listeners
  useEffect(() => {
    if (!socketRef.current || !isInitialized) return;

    const handleIncomingCall = ({ from, signal }: { from: string; signal: any }) => {
      console.log('Received call from:', from);
      answerCall(signal);
    };

    socketRef.current.on('callUser', handleIncomingCall);

    return () => {
      socketRef.current?.off('callUser', handleIncomingCall);
    };
  }, [isInitialized]);

  const startCall = () => {
    if (!stream || !socketRef.current?.connected) {
      console.error('Stream or socket not available');
      setError('Cannot start call - please check your camera and internet connection');
      return;
    }

    console.log('Starting call to room:', roomId);
    const newPeer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream
    });

    newPeer.on('signal', data => {
      console.log('Sending signal data');
      socketRef.current?.emit('callUser', {
        userToCall: roomId,
        signalData: data,
        from: currentRoomId
      });
    });

    newPeer.on('stream', remoteStream => {
      console.log('Received remote stream');
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = remoteStream;
      }
    });

    newPeer.on('error', err => {
      console.error('Peer error:', err);
      setError('Failed to establish peer connection');
      endCall();
    });

    socketRef.current.on('callAccepted', signal => {
      console.log('Call accepted, signaling peer');
      newPeer.signal(signal);
      setIsCallActive(true);
    });

    setPeer(newPeer);
  };

  const answerCall = (incomingSignal: any) => {
    if (!stream || !socketRef.current?.connected) {
      console.error('Stream or socket not available');
      setError('Cannot answer call - please check your camera and internet connection');
      return;
    }

    console.log('Answering call');
    const newPeer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream
    });

    newPeer.on('signal', data => {
      console.log('Sending answer signal');
      socketRef.current?.emit('answerCall', { signal: data, to: roomId });
    });

    newPeer.on('stream', remoteStream => {
      console.log('Received remote stream');
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = remoteStream;
      }
    });

    newPeer.on('error', err => {
      console.error('Peer error:', err);
      setError('Failed to establish peer connection');
      endCall();
    });

    newPeer.signal(incomingSignal);
    setPeer(newPeer);
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
      setPeer(null);
    }
    setIsCallActive(false);
  };

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        <p>{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

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
            disabled={!isInitialized}
            className={`px-4 py-2 text-white rounded-lg ${
              isInitialized 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isInitialized ? 'Start Call' : 'Initializing...'}
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