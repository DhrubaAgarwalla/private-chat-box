'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onVoiceMessageSend: (voiceUrl: string) => void;
}

export default function VoiceRecorder({ onVoiceMessageSend }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
      };

      // Start recording and duration counter
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Auto-stop after 60 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
          toast.info('Recording stopped at maximum duration (60s)');
        }
      }, 60000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioBlob(null);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    } else if (audioBlob) {
      setAudioBlob(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob) return;

    try {
      setIsUploading(true);
      toast.loading('Sending voice message...', { id: 'voiceUpload' });

      const filename = `voice-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('voice-messages')
        .upload(filename, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(filename);

      onVoiceMessageSend(publicUrl);
      setAudioBlob(null);
      toast.success('Voice message sent', { id: 'voiceUpload' });
    } catch (error) {
      console.error('Error uploading voice message:', error);
      toast.error('Failed to send voice message', { id: 'voiceUpload' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {!isRecording && !audioBlob && (
        <button
          onClick={startRecording}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Start Recording"
        >
          <Mic className="w-5 h-5" />
        </button>
      )}

      {isRecording && (
        <div className="flex items-center space-x-2">
          <div className="text-sm text-red-500 animate-pulse">
            {formatDuration(recordingDuration)}
          </div>
          <button
            onClick={stopRecording}
            className="p-2 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            title="Stop Recording"
          >
            <Square className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={cancelRecording}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Cancel Recording"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}

      {audioBlob && !isRecording && (
        <div className="flex items-center space-x-2">
          <button
            onClick={sendVoiceMessage}
            disabled={isUploading}
            className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50"
            title="Send Voice Message"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
          <button
            onClick={cancelRecording}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Cancel"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
} 