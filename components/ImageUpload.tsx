"use client";

import { useState, useRef } from 'react';
import { FaImage } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';

interface ImageUploadProps {
  onImageUpload: (url: string) => void;
}

export default function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 2, // Target size after compression
      maxWidthOrHeight: 1920, // Max width/height while maintaining aspect ratio
      useWebWorker: true,
      fileType: file.type,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw new Error('Failed to compress image');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Check file type (only allow images)
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image size must be less than 10MB');
      }
      
      // Compress the image
      const compressedFile = await compressImage(file);
      
      // Generate a unique filename
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('chat-images')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) throw error;
      
      console.log('File uploaded successfully:', data);
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(data.path);
      
      if (!urlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }
      
      console.log('Public URL:', urlData.publicUrl);
      
      // Call the callback with the URL
      onImageUpload(urlData.publicUrl);
      
      // Reset the input
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      <button
        onClick={handleUploadClick}
        className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors relative overflow-hidden"
        title="Upload image"
        disabled={isUploading}
      >
        {isUploading ? (
          <FaImage className="h-5 w-5 opacity-50" />
        ) : (
          <FaImage className="h-5 w-5" />
        )}
      </button>
    </>
  );
} 