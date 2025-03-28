import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a 12-character alphanumeric room ID
 */
export function generateRoomId(): string {
  // Generate a random alphanumeric string of length 12
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
    
    // Add a dash after every 4 characters (except at the end)
    if (i % 4 === 3 && i < 11) {
      result += '-';
    }
  }
  
  return result;
}

/**
 * Formats a timestamp to a human-readable string
 * Uses a consistent format to avoid hydration errors
 */
export function formatTimestamp(timestamp: string): string {
  if (typeof window === 'undefined') {
    // On server, return a simple formatted time to avoid locale issues
    const date = new Date(timestamp);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } else {
    // On client, we can use locale-specific formatting
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      // Fallback to simple format in case of errors
      const date = new Date(timestamp);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }
}

/**
 * Generates a unique user ID
 */
export function generateUserId(): string {
  return uuidv4();
}

/**
 * Checks if a string is a valid room ID format
 */
export function isValidRoomId(roomId: string): boolean {
  // Format should be XXXX-XXXX-XXXX where X is alphanumeric
  const roomIdRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return roomIdRegex.test(roomId);
} 