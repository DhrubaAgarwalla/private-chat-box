# Message Box - Secure Private Chat

A secure, real-time private chat application with unique room IDs. No registration required - completely anonymous.

## Features

- **Unique Chat Rooms**: Auto-generated 12-digit alphanumeric room IDs
- **Anonymous**: No registration or personal data required
- **Real-time Messaging**: Using Supabase Realtime
- **Message Persistence**: Store messages in Supabase PostgreSQL
- **Message Actions**: Save important messages, delete individual messages, clear chat history
- **User Experience**: Typing indicators, read receipts, responsive design
- **Image Sharing**: Upload and share images in chat
- **Voice Messages**: Record and send voice messages
- **Video Calling**: Integrated video calls using Daily.co

## Video Calling with Daily.co

This project uses [Daily.co](https://www.daily.co/) for video calling functionality. Daily.co provides a simple, reliable, and scalable video calling API that works across browsers and devices.

### How it works

1. When a user initiates a call, a unique Daily.co room is created
2. Other users in the chat receive a notification about the incoming call
3. When they join, they're connected to the same Daily.co room
4. The video call interface appears as an overlay on top of the chat

### Free Tier Limitations

The free tier of Daily.co includes:
- 4 participants per call
- 40 minutes per call
- 10,000 minutes per month

For production use, consider upgrading to a paid plan.

## Supabase Backend

The app uses Supabase for:
- Real-time database (for messages)
- Authentication
- Storage (for images and voice messages)
- Presence channels (for typing indicators)

## Tech Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Supabase (Auth, Realtime, PostgreSQL)
- **UI Components**: Custom components with React Icons
- **State Management**: React Context API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

1. [Node.js](https://nodejs.org/) (v14 or newer)
2. [Supabase Account](https://supabase.com/)

### Setting up Supabase

1. Create a new Supabase project
2. Set up the following tables in your database:

#### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  room_id VARCHAR NOT NULL,
  content TEXT NOT NULL,
  sender_id VARCHAR NOT NULL,
  is_saved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries by room_id
CREATE INDEX idx_messages_room_id ON messages(room_id);
```

#### Rooms Table
```sql
CREATE TABLE rooms (
  id VARCHAR PRIMARY KEY,
  creator_id VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Migration: Adding creator_id to Rooms Table
If you're updating from a previous version, run this SQL in your Supabase SQL editor:

```sql
-- Add creator_id column to rooms table
ALTER TABLE rooms ADD COLUMN creator_id VARCHAR;

-- Set a default value for existing rooms
-- This is temporary - new rooms will have proper creator_id values
UPDATE rooms SET creator_id = 'system-migration';

-- Make creator_id NOT NULL after setting defaults
ALTER TABLE rooms ALTER COLUMN creator_id SET NOT NULL;

-- Update RLS policies for room creators
CREATE POLICY "Allow creator to delete their rooms" 
ON rooms FOR DELETE USING (auth.uid()::text = creator_id OR creator_id = 'system-migration');
```

### Set up Row-Level Security Policies

```sql
-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Allow public read access to messages" 
ON messages FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to messages" 
ON messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow sender to delete their own messages" 
ON messages FOR DELETE USING (auth.uid()::text = sender_id);

CREATE POLICY "Allow public update access to save messages" 
ON messages FOR UPDATE USING (true) WITH CHECK (true);

-- Rooms policies
CREATE POLICY "Allow public read access to rooms" 
ON rooms FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to rooms" 
ON rooms FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to rooms" 
ON rooms FOR UPDATE USING (true) WITH CHECK (true);
```

### Create Function to Clean Up Inactive Rooms

Note: With the new feature, rooms are no longer auto-deleted. The creator must delete them manually.
If you still want to implement auto-deletion, use the following function:

```sql
-- Function to delete rooms inactive for over 24 hours
CREATE OR REPLACE FUNCTION cleanup_inactive_rooms()
RETURNS void AS $$
BEGIN
  -- Delete messages in inactive rooms
  DELETE FROM messages
  WHERE room_id IN (
    SELECT id FROM rooms
    WHERE last_activity < NOW() - INTERVAL '24 hours'
  );
  
  -- Delete inactive rooms
  DELETE FROM rooms
  WHERE last_activity < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Schedule this function to run daily
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('0 0 * * *', 'SELECT cleanup_inactive_rooms()');
```

### Enable Realtime

1. Go to your Supabase Dashboard > Database > Replication
2. Enable publication for the `messages` and `rooms` tables

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/message-box.git
cd message-box
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env.local` file with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This application can be easily deployed on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Set the environment variables in the Vercel dashboard
4. Deploy!

## Security Considerations

- The application uses Supabase RLS policies to control data access
- Room creators have the ability to delete their rooms
- Consider implementing E2E encryption for additional security

## License

MIT