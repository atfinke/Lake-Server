const express = require('express');

const WebSocket = require('ws');
const SocketServer = WebSocket.Server;

const path = require('path');
const INDEX = path.join(__dirname, 'index.html');

const PORT = process.env.PORT || 3000;
const server = express()
  .use((req, res) => res.sendFile(INDEX))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({
  server
});

var connectionPairCodes = [];
var connectionDeviceNames = [];
var lakeServerViewer = ""

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    var senderPairCode = connectionPairCodes[String(ws._socket.remoteAddress)];
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        var clientAddress = String(client._socket.remoteAddress);
        if (clientAddress in connectionPairCodes && connectionPairCodes[clientAddress] == senderPairCode) {
          client.send(data);
        } else {
          console.log("Sender client mismatch");
          console.log(senderPairCode);
          console.log(connectionPairCodes[clientAddress]);
          console.log("-------");
        }
      }
    });

    if (typeof data === 'string' || data instanceof String) {
      if (data.startsWith("LAKE_SERVER")) {
        var params = data.split("|");
        if (params.length >= 4) {
          var destination = params[1];
          var messageType = params[2];
          var messageArgOne = params[3];

          if (destination == "server") {
            if (messageType == "pairCode") {
              var clientAddress = String(ws._socket.remoteAddress);

              var pairCode = messageArgOne;
              connectionPairCodes[clientAddress] = pairCode;

              var clientName = params[4];
              connectionDeviceNames[clientAddress] = clientName;

              console.log("New Pair Code");
              console.log(clientAddress);
              console.log(clientName);
              console.log(pairCode);
              console.log("-------");

              sendClientConnected(clientAddress, pairCode);

              if (pairCode == "SERVER_VIEWER") {
                  lakeServerViewer = clientAddress
              }
            } else {
              console.log("Unsupported messageType");
            }
          } else {
            console.log("Unsupported destination");
          }
        }
      }
    }
  });
});

function sendClientConnected(newClientAddress, pairCode) {
  wss.clients.forEach(function each(client) {
    var clientAddress = String(client._socket.remoteAddress);
    if (client.readyState === WebSocket.OPEN && newClientAddress != clientAddress) {
      if (clientAddress in connectionPairCodes && connectionPairCodes[clientAddress] == pairCode) {
        var deviceName = connectionDeviceNames[clientAddress]
        // LAKE_SERVER|Destination|Type|arg1|arg2...
        var key = "LAKE_SERVER|client|newClient|" + deviceName
        client.send(data);

        console.log("Sending existing client new client info");
        console.log(clientAddress);
        console.log(newClientAddress);
        console.log("-------");
      }
    }
  });
}

const interval = setInterval(function ping() {
  var allClientAddress = [];
  wss.clients.forEach(function each(ws) {
    ws.send("KEEP_ALIVE");
    var clientAddress = String(ws._socket.remoteAddress);
    allClientAddress.push(clientAddress);
  });

  var clientsToRemove = [];
  for (var clientAddress in connectionDeviceNames) {
    if (allClientAddress.indexOf(clientAddress) == -1) {
      clientsToRemove.push(clientAddress)
      var pairCode = connectionPairCodes[clientAddress];
      var deviceName = connectionDeviceNames[clientAddress];
      console.log("CLIENT DISCONNECTED:");
      console.log(clientAddress);
      console.log(pairCode);
      console.log(deviceName);
      console.log("-------");
    }
  }

for (var index = 0; index < clientsToRemove.length; index++) {
    var clientAddress = clientsToRemove[index];
    delete connectionPairCodes[clientAddress];
    delete connectionDeviceNames[clientAddress];
  }
}, 10000);

setInterval(function ping() {
  var statusString = "Total Clients: " + String(wss.clients.length) + "\n"
  statusString += String(connectionDeviceNames) + "\n"
  statusString += String(connectionPairCodes) + "\n"
  statusString += String("-------")

  if (wss.clients.length != 0) {
    console.log(statusString);
  }

  var message = "LAKE_SERVER|server|status|" + statusString;

  wss.clients.forEach(function each(client) {
    var clientAddress = String(client._socket.remoteAddress);
    if (client.readyState === WebSocket.OPEN && newClientAddress != clientAddress) {
      if (clientAddress in connectionPairCodes && connectionPairCodes[clientAddress] == "SERVER_VIEWER") {
        client.send(message)
      }
    }
  });

}, 30000);
