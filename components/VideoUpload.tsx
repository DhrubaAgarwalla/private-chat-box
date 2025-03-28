"use client";

import { useRef, useState } from 'react';
import { FaVideo } from 'react-icons/fa';
import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface VideoUploadProps {
  onUploadComplete: (url: string) => void;
}

export default function VideoUpload({ onUploadComplete }: VideoUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleVideoClick = () => {
    if (videoInputRef.current) {
      videoInputRef.current.click();
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    // Validate file size (limit to 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Video file size must be less than 20MB');
      return;
    }

    setIsLoading(true);

    try {
      // Generate a unique filename
      const filename = `${uuidv4()}-${file.name.replace(/\s+/g, '_')}`;
      const filePath = `videos/${filename}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('video-messages')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        throw error;
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('video-messages')
        .getPublicUrl(filePath);

      // Call the callback with the video URL
      onUploadComplete(publicUrlData.publicUrl);
      toast.success('Video uploaded successfully');

      // Reset the file input
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleVideoChange}
        className="hidden"
        accept="video/mp4,video/webm,video/ogg"
      />
      <button
        onClick={handleVideoClick}
        className="p-2 rounded-full bg-purple-500 text-white hover:bg-purple-600 transition-colors"
        title="Upload video message"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <FaVideo className="h-5 w-5" />
        )}
      </button>
    </>
  );
} 