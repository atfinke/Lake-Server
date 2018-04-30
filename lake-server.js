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
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  ws.on('message', function incoming(data) {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
});

function noop() {}

function heartbeat() {
  this.isAlive = true;
}

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) {
      wss.clients.forEach(function each(client) {
        if (client !== ws) {
          client.send("LAKE_SERVER_DEVICE_DISCONNECT");
        }
      });
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping(noop);
    ws.send("KEEP_ALIVE");
  });
}, 10000);
