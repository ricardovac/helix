import { io, type Socket } from 'socket.io-client';
import { API_URL } from './api';

export function createChatSocket(token: string): Socket {
  return io(`${API_URL}/chat`, {
    transports: ['websocket'],
    autoConnect: true,
    auth: { token },
  });
}
