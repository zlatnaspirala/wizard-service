/**
 * @description Just Hosting.
 * `https` variant recommended.
 */

var https = require('https');
var fs = require("fs");
const express = require("express");
const app = express();
var serverRunner = null;
var options = {};
const EventEmitter = require('events');
var eventEmitter = new EventEmitter();

app.use(express.static("public"));
app.get("/", function(req, res) {
  res.send("<h1>thanks for using goldenspiral software!</h1>");
});

if(process.platform == 'win32') {
  options = {};
  serverRunner = http;
} else {
  options = {
    key: fs.readFileSync("/etc/letsencrypt/live/maximumroulette.com/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/maximumroulette.com/fullchain.pem")
  };
  serverRunner = https;
  console.log('SSL enabled.');
}

https.createServer(options, app).listen(8080);
// start the server listening for requests
// app.listen(process.env.PORT || 8080, 
//   () => console.log("Server is running..."));

/** 
 * @note 
 * Use the websocket-relay to serve a raw MPEG-TS over WebSockets. You can use
 * ffmpeg to feed the relay. ffmpeg -> websocket-relay -> browser
 * Example:
 * node websocket-relay yoursecret 8081 8082
 * ffmpeg -i <some input> -f mpegts http://localhost:8081/yoursecret
 * */

var fs = require('fs'),
  http = require('http'),
  WebSocket = require('ws');

if(process.argv.length < 3) {
  console.log('Usage: \n' + 'node websocket-relay.js <secret> [<stream-port> <websocket-port>]');
  process.exit();
}

var STREAM_SECRET = process.argv[2],
  STREAM_PORT = process.argv[3] || 8081,
  WEBSOCKET_PORT = process.argv[4] || 8082,
  RECORD_STREAM = false;

var MAXIMUM_USERS = 1;
var SOCKET_USERS = {};
var STREAM_ARRAY = [];


// HTTP Server to accept incomming MPEG-TS Stream from ffmpeg
var streamServer = serverRunner.createServer(options, function(request, response) {
  var params = request.url.substr(1).split('/');

  console.log(`streamServer url  ${request.url}`);
  console.log("streamServer params  " + params);

  request.on('close', function(e) {
    STREAM_ARRAY = [];
    // console.log('EXPERIMENTAL close stream detected : clear for now STREAM_ARRAY = []; ',SOCKET_USERS);
    console.log('EXPERIMENTAL close stream detected : kill socket user ', params[1]);
    if(typeof SOCKET_USERS[params[1]] !== 'undefined') {
      console.log('EXPERIMENTAL SOCKET EXIST KILL HIM : kill socket user ', params[1]);
      // SOCKET_USERS[params[1]].send("NIDZA-NIDZA");
      SOCKET_USERS[params[1]].close();
      eventEmitter.emit('end-stream', {id: params[1]});
      SOCKET_USERS = {};
    }
  });

  // TEST FIRST SUPER SECRET
  if(params[0] !== STREAM_SECRET) {
    console.log(
      'Failed Stream Connection: ' + request.socket.remoteAddress + ':' +
      request.socket.remotePort + ' - wrong super secret.'
    );
    response.end();
    return;
  }

  // TEST LIMIT
  if(STREAM_ARRAY.length > 1) {
    console.log(
      'Failed Stream Connection: ' + request.socket.remoteAddress + ':' +
      request.socket.remotePort + ' - reached limit.'
    );
    response.end();
    eventEmitter.emit('end-stream', {id: params[1]});
    console.log("end-stream event! ", STREAM_ARRAY.length)
    return;
  }

  response.connection.setTimeout(0);
  console.log('Stream ID added: ' + params[1]);
  console.log('Stream Connected: ' + request.socket.remoteAddress + ':' + request.socket.remotePort);
  STREAM_ARRAY.push(params[1]);
  console.log('EMIT TO XY: ' + STREAM_ARRAY[0]);
  eventEmitter.emit('new-stream', {id: STREAM_ARRAY[STREAM_ARRAY.length - 1]})

  request.on('data', function(data) {
    socketServer.broadcast(data);
    if(request.socket.recording) {
      request.socket.recording.write(data);
    }
  });

  request.on('end', function(e) {
    console.log('NEVER NEVER !!! e -> ', e);
    // TEST 
    /* var index = STREAM_ARRAY.indexOf(item);
    if (index !== -1) {
      array.splice(index, 1);
    } */
    if(request.socket.recording) {
      request.socket.recording.close();
    }
  });

  // Record the stream to a local file?
  if(RECORD_STREAM) {
    var path = 'recordings/' + Date.now() + '.ts';
    request.socket.recording = fs.createWriteStream(path);
  }
}).listen(STREAM_PORT);

console.log('Listening for incomming MPEG-TS Stream on https://127.0.0.1:' + STREAM_PORT + '/<secret>');
console.log('Awaiting WebSocket connections on wss://127.0.0.1:' + WEBSOCKET_PORT + '/');

var httpsVar = https.createServer(options).listen(WEBSOCKET_PORT);

// Websocket Server
var socketServer = new WebSocket.Server({server: httpsVar /*, perMessageDeflate: false*/});
socketServer.connectionCount = 0;

socketServer.on('connection', function(socket, upgradeReq) {

  console.log(`connection [websocket] -> ${upgradeReq.url}`);
  console.log(`connection [websocket] - STREAM_ARRAY: `, STREAM_ARRAY);

  eventEmitter.socketServer = socketServer;

  var incommingSecret = upgradeReq.url.toString().substring(1);
  console.log(`Conn Url on [websocket] -test incommingSecret ${incommingSecret}`);
  // TEST LIMIT
  if(socketServer.connectionCount >= MAXIMUM_USERS) {
    console.log(`CLOSE REASON [websocket] ALREADY USED, MAXIMUM USAGE REACHED.  -> ${upgradeReq.url}`);
    socket.close();
    return;
  }

  // just test stream id and socket page id 
  if(incommingSecret == STREAM_ARRAY[0]) {
    console.log("Nice, test socket.send ", socket.send);
    socket.wizardInstance = STREAM_ARRAY[0];
    SOCKET_USERS[STREAM_ARRAY[0]] = socket;
  } else {
    // for now only one instance 
    console.log(`CLOSE REASON [websocket] STREAM ID NOT THE SAME !!!  -> ` + incommingSecret);
    socket.close();
    return;
  }

  socketServer.connectionCount++;

  console.log('New WebSocket Connection: ',
    (upgradeReq || socket.upgradeReq).socket.remoteAddress,
    (upgradeReq || socket.upgradeReq).headers['user-agent'],
    '(' + socketServer.connectionCount + ' total)'
  );
  socket.on('close', function(code, message) {
    socketServer.connectionCount--;
    console.log('Disconnected WebSocket (' + SOCKET_USERS + ' total)');
    SOCKET_USERS = {};
    console.log('Disconnected WebSocket (' + socketServer.connectionCount + ' total)');
  });

  socketServer.userSocketTest = socket;
  // endDetectedFromXY

});

socketServer.broadcast = function(data) {
  socketServer.clients.forEach(function each(client) {
    // console.log("client.wizardInstance " + client.wizardInstance)
    if(typeof client.wizardInstance == 'undefined') {
      console.log(" KILLER SOCKET BECOUSE NO HAVE wizard id ")
      client.close();
      return;
    }

    if(client.wizardInstance == STREAM_ARRAY[0] && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};


var XYCORD = require('./xy');

eventEmitter.on('xy-new-user', (e) => {
  console.log('STREAM EVENT EMITTER !!', e.name);
});


eventEmitter.on('endDetectedFromXY', function(e) {
  console.log('STREAM JUST CLEAN STREAM ! ', e);
  // socketServer.userSocketTest.close();
  console.log(' TEST socketServer.userSocketTest.close() !', socketServer.userSocketTest.close());
});

XYCORD.INJECTOR(eventEmitter);
