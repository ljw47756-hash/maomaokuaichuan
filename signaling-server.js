import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

// Map room ID to a Set of sockets
const rooms = new Map();

console.log('Signaling server running on port 8080');
console.log('Ensure your frontend connects to ws://YOUR_LOCAL_IP:8080');

wss.on('connection', (ws) => {
  ws.currentRoom = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle Joining a Room
      if (data.type === 'join') {
        const { room } = data;
        
        if (!rooms.has(room)) {
            rooms.set(room, new Set());
        }
        
        // Limit to 2 peers per room for this demo
        if (rooms.get(room).size >= 2) {
            ws.send(JSON.stringify({ type: 'error', payload: 'Room is full' }));
            return;
        }

        rooms.get(room).add(ws);
        ws.currentRoom = room;
        console.log(`Client joined room: ${room}. Total peers: ${rooms.get(room).size}`);
      } 
      // Handle Signaling Messages (Offer, Answer, Candidate, Ready)
      else if (ws.currentRoom && rooms.has(ws.currentRoom)) {
        // Broadcast to other peers in the room (excluding self)
        const roomPeers = rooms.get(ws.currentRoom);
        roomPeers.forEach(client => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify(data));
          }
        });
      }
    } catch (e) {
      console.error('Error processing message:', e);
    }
  });

  ws.on('close', () => {
    if (ws.currentRoom && rooms.has(ws.currentRoom)) {
      rooms.get(ws.currentRoom).delete(ws);
      if (rooms.get(ws.currentRoom).size === 0) {
        rooms.delete(ws.currentRoom);
      }
      console.log(`Client disconnected from room: ${ws.currentRoom}`);
    }
  });
});