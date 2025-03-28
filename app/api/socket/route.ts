import { Server as SocketIOServer } from 'socket.io';

const io = new SocketIOServer({
  path: '/api/socket',
  addTrailingSlash: false,
});

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('callUser', ({ userToCall, signalData, from }) => {
    io.to(userToCall).emit('callUser', { signal: signalData, from });
  });

  socket.on('answerCall', ({ signal, to }) => {
    io.to(to).emit('callAccepted', signal);
  });

  socket.on('joinRoom', (roomId: string) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

export const GET = () => {
  return new Response('WebSocket server is running', { status: 200 });
};

export const POST = () => {
  return new Response('WebSocket server is running', { status: 200 });
}; 