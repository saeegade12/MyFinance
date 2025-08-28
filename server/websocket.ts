import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export interface WebSocketMessage {
  type: string;
  data?: any;
  userId?: string;
}

export class FinanceWebSocketServer {
  private wss: WebSocketServer;
  private connections: Map<string, WebSocket> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection established');

      ws.on('message', (message: Buffer) => {
        try {
          const data: WebSocketMessage = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Invalid message format' 
          }));
        }
      });

      ws.on('close', () => {
        // Remove connection when client disconnects
        for (const [userId, connection] of this.connections.entries()) {
          if (connection === ws) {
            this.connections.delete(userId);
            console.log(`User ${userId} disconnected`);
            break;
          }
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: WebSocketMessage): void {
    switch (message.type) {
      case 'auth':
        if (message.userId) {
          this.connections.set(message.userId, ws);
          console.log(`User ${message.userId} authenticated via WebSocket`);
          ws.send(JSON.stringify({ 
            type: 'auth_success', 
            message: 'Successfully authenticated' 
          }));
        }
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  public broadcast(userId: string, message: WebSocketMessage): boolean {
    const connection = this.connections.get(userId);
    
    if (connection && connection.readyState === WebSocket.OPEN) {
      try {
        connection.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        // Remove invalid connection
        this.connections.delete(userId);
        return false;
      }
    }
    
    return false;
  }

  public broadcastToAll(message: WebSocketMessage): void {
    for (const [userId, connection] of this.connections.entries()) {
      if (connection.readyState === WebSocket.OPEN) {
        try {
          connection.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Failed to broadcast to user ${userId}:`, error);
          this.connections.delete(userId);
        }
      }
    }
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connections.keys());
  }

  public isUserConnected(userId: string): boolean {
    const connection = this.connections.get(userId);
    return connection !== undefined && connection.readyState === WebSocket.OPEN;
  }
}
