import { WebSocketServer, WebSocket } from "ws";

// Define port (use environment variable or default to 8080)
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

// Initialize WebSocket server
const wss = new WebSocketServer({ port: PORT });

// Define interfaces
interface User {
  socket: WebSocket;
  room: string;
  id: string; // Unique identifier for each connection
}

// Store all active connections
let activeUsers: User[] = [];

// Generate a unique ID for each connection
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Find the room ID for a specific socket
function findRoomForSocket(socket: WebSocket): string | null {
  const user = activeUsers.find(user => user.socket === socket);
  return user ? user.room : null;
}

// Remove a socket from the active users list
function removeSocket(socket: WebSocket): void {
  activeUsers = activeUsers.filter(user => user.socket !== socket);
}

// Count users in a specific room
function getUsersInRoom(roomId: string): number {
  return activeUsers.filter(user => user.room === roomId).length;
}

// Log with timestamp
function log(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Handle WebSocket connections
wss.on("connection", (socket: WebSocket) => {
  log("New client connected");
  
  // Define a heartbeat ping interval to detect disconnected clients
  const pingInterval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.ping();
    }
  }, 30000); // 30 seconds
  
  // Handle incoming messages
  socket.on("message", (message: Buffer) => {
    try {
      // Parse the incoming message
      const parsedMessage = JSON.parse(message.toString());
      
      // Handle different message types
      switch (parsedMessage.type) {
        case "join":
          const roomId = parsedMessage.payload.roomId;
          if (!roomId) {
            log("Room ID missing in join request");
            return;
          }
          
          // Add the user to the room
          const userId = generateId();
          activeUsers.push({
            socket,
            room: roomId,
            id: userId
          });
          
          log(`User ${userId} joined room ${roomId}`);
          
          // Notify all users in the room about the new user
          const roomUserCount = getUsersInRoom(roomId);
          activeUsers
            .filter(user => user.room === roomId)
            .forEach(user => {
              user.socket.send(`A new user has joined. (${roomUserCount} user${roomUserCount > 1 ? 's' : ''} in room)`);
            });
          break;
        
        case "chat":
          const message = parsedMessage.payload.message;
          if (!message) {
            log("Message content missing in chat request");
            return;
          }
          
          // Find the user's current room
          const currentRoom = findRoomForSocket(socket);
          if (!currentRoom) {
            log("User not found in any room");
            return;
          }
          
          log(`Message in room ${currentRoom}: ${message}`);
          
          // Send the message to all users in the room except the sender
          activeUsers
            .filter(user => user.room === currentRoom && user.socket !== socket)
            .forEach(user => {
              user.socket.send(message);
            });
          break;
          
        default:
          log(`Unknown message type: ${parsedMessage.type}`);
      }
    } catch (error) {
      log(`Error processing message: ${error}`);
    }
  });
  
  // Handle client disconnection
  socket.on("close", () => {
    clearInterval(pingInterval);
    
    // Find the user's room before removing
    const room = findRoomForSocket(socket);
    
    // Remove the socket from active users
    removeSocket(socket);
    
    if (room) {
      log(`Client disconnected from room ${room}`);
      const roomUserCount = getUsersInRoom(room);
      
      // Notify remaining users in the room
      if (roomUserCount > 0) {
        activeUsers
          .filter(user => user.room === room)
          .forEach(user => {
            user.socket.send(`A user has left. (${roomUserCount} user${roomUserCount > 1 ? 's' : ''} in room)`);
          });
      } else {
        log(`Room ${room} is now empty`);
      }
    } else {
      log("Client disconnected (not in any room)");
    }
  });
  
  // Handle errors
  socket.on("error", (error) => {
    log(`WebSocket error: ${error}`);
    clearInterval(pingInterval);
    removeSocket(socket);
  });
});

// Log server startup
log(`WebSocket server started on port ${PORT}`);

// Handle process termination
process.on("SIGINT", () => {
  log("Shutting down server");
  wss.close();
  process.exit(0);
}); 