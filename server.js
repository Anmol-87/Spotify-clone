// server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

let clients = [];

wss.on('connection', ws => {
    clients.push(ws);
    ws.on('message', message => {
        // Broadcast to all clients except sender
        clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        clients = clients.filter(c => c !== ws);
    });
});

console.log("WebSocket server running on ws://localhost:3000");