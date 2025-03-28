-- Create a new bucket for video messages
INSERT INTO storage.buckets (id, name)
VALUES ('video-messages', 'video-messages')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access to video messages
CREATE POLICY "Allow public access to video messages"
ON storage.objects FOR ALL
USING (bucket_id = 'video-messages')
WITH CHECK (bucket_id = 'video-messages');

-- Update message_type enum to include 'video'
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_message_type_check;

ALTER TABLE messages 
ADD CONSTRAINT messages_message_type_check 
CHECK (message_type IN ('text', 'image', 'voice', 'video'));

-- Add video_url column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS video_url TEXT; 