import { io } from 'socket.io-client';

let socket = null;
let messageListeners = [];

export const connectWebSocket = () => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io('https://localhost:5000', {
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // Listen for incoming messages
  socket.on('receive_message', (messageData) => {
    messageListeners.forEach((callback) => {
      callback(messageData);
    });
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  return socket;
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinConversation = (conversationId) => {
  if (!socket || !socket.connected) {
    connectWebSocket();
  }
  socket.emit('join_conversation', { conversation_id: conversationId });
};

export const leaveConversation = (conversationId) => {
  if (socket && socket.connected) {
    socket.emit('leave_conversation', { conversation_id: conversationId });
  }
};

export const sendMessage = (conversationId, body, userId) => {
  if (!socket || !socket.connected) {
    console.error('WebSocket not connected');
    return;
  }
  socket.emit('send_message', {
    conversation_id: conversationId,
    body: body,
    user_id: userId,
  });
};

export const onMessage = (callback) => {
  messageListeners.push(callback);
  
  return () => {
    messageListeners = messageListeners.filter((listener) => listener !== callback);
  };
};

export const getSocket = () => {
  return socket;
};
