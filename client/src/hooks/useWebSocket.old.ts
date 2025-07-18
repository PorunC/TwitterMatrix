import { useEffect, useRef, useState } from 'react';
import { WebSocketMessage } from '../types';

export function useWebSocket(onMessage?: (message: WebSocketMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function connect() {
      // If we've made too many reconnection attempts, stop trying
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.log('Max reconnection attempts reached. Stopping...');
        return;
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      try {
        // Close existing connection if any
        if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
          wsRef.current.close();
        }
        
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          setIsConnected(true);
          reconnectAttempts.current = 0; // Reset attempts on successful connection
          console.log('WebSocket connected');
          
          // Start ping/pong to keep connection alive
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
          }
          pingIntervalRef.current = setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'ping' }));
            }
          }, 25000); // Ping every 25 seconds
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('WebSocket message:', message);
            
            // Handle connection confirmation
            if (message.type === 'connected') {
              console.log('WebSocket connection confirmed by server');
            }
            
            onMessage?.(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        wsRef.current.onclose = (event) => {
          setIsConnected(false);
          console.log('WebSocket disconnected');
          
          // Clear ping interval
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
          
          // Only reconnect if it wasn't a clean close and we haven't exceeded max attempts
          if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.min(2000 * reconnectAttempts.current, 10000); // Linear backoff, max 10s
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log(`Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
              connect();
            }, delay);
          } else if (reconnectAttempts.current >= maxReconnectAttempts) {
            console.log('Max reconnection attempts reached. Stopping...');
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        setIsConnected(false);
      }
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting'); // Clean close
      }
    };
  }, [onMessage]);

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  // Ping handling is now done in onopen handler

  return { isConnected, sendMessage };
}
