const express = require('express');

const WebSocket = require('ws');
const SocketServer = WebSocket.Server;

const path = require('path');
const INDEX = path.join(__dirname, 'index.html');

const PORT = process.env.PORT || 3000;
const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({ server });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
});

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    ws.send("KEEP_ALIVE");
  });
  console.log("SENDING KEEP_ALIVE");
  console.log(wss.clients.length);
}, 10000);
