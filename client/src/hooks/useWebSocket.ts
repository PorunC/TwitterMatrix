import { WebSocketMessage } from '../types';

// Simplified WebSocket hook that doesn't actually use WebSocket
// This maintains compatibility with existing code while removing the WebSocket functionality
export function useWebSocket(onMessage?: (message: WebSocketMessage) => void) {
  // Always return connected state to avoid UI issues
  const isConnected = true;
  
  // No-op send message function
  const sendMessage = (message: WebSocketMessage) => {
    // Do nothing - WebSocket functionality removed
  };

  return { isConnected, sendMessage };
}