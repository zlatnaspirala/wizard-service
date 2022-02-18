

// HOSTING TEST
var https = require('https');
var fs = require("fs");
// create an express app
const express = require("express")
const app = express()

// use the express-static middleware
app.use(express.static("public"))

// define the first route
app.get("/", function (req, res) {
  res.send("<h1>Hello World nidza !</h1>")
})

// start the server listening for requests
app.listen(process.env.PORT || 8080, 
	() => console.log("Server is running..."));

// Use the websocket-relay to serve a raw MPEG-TS over WebSockets. You can use
// ffmpeg to feed the relay. ffmpeg -> websocket-relay -> browser
// Example:
// node websocket-relay yoursecret 8081 8082
// ffmpeg -i <some input> -f mpegts http://localhost:8081/yoursecret

var fs = require('fs'),
	http = require('http'),
	WebSocket = require('ws');

if (process.argv.length < 3) {
	console.log(
		'Usage: \n' +
		'node websocket-relay.js <secret> [<stream-port> <websocket-port>]'
	);
	process.exit();
}

var STREAM_SECRET = process.argv[2],
	STREAM_PORT = process.argv[3] || 8081,
	WEBSOCKET_PORT = process.argv[4] || 8082,
	RECORD_STREAM = false;

var MAXIMUM_USERS = 1;
var STREAM_ARRAY = [];

// Websocket Server
var socketServer = new WebSocket.Server({port: WEBSOCKET_PORT, perMessageDeflate: false});
socketServer.connectionCount = 0;

socketServer.on('connection', function(socket, upgradeReq) {
	
	// console.log('New WebSocket Connection: test HEADERS arg socket => ', (upgradeReq || socket.upgradeReq).headers);
	console.log(`Conn Url on [websocket] ->>>>>>>>>>>>>>>>>> ${upgradeReq.url}`);

		// TEST LIMIT
		if (socketServer.connectionCount >= MAXIMUM_USERS) {
			console.log(`CLOSE REASON [websocket] LAREADY USED >>>>>>>>> ${upgradeReq.url}`);
			socket.close();
		}

		socketServer.connectionCount++;

	console.log(
		'New WebSocket Connection: ', 
		(upgradeReq || socket.upgradeReq).socket.remoteAddress,
		(upgradeReq || socket.upgradeReq).headers['user-agent'],
		'('+socketServer.connectionCount+' total)'
	);
	socket.on('close', function(code, message){
		socketServer.connectionCount--;
		console.log(
			'Disconnected WebSocket ('+socketServer.connectionCount+' total)'
		);
	});
});

socketServer.broadcast = function(data) {
	// console.log(">>>>>>> >>>>>> BROADCAST >>>>test lenght >>>", socketServer.clients.length);
	socketServer.clients.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(data);
		}
	});
};

// HTTP Server to accept incomming MPEG-TS Stream from ffmpeg
var streamServer = http.createServer( function(request, response) {
	var params = request.url.substr(1).split('/');

	console.log(`ON RESPONSE __url_____  ${request.url}`);
	console.log("ON RESPONSE params  " + params);

	// TEST FIRST SUPER SECRET
	if (params[0] !== STREAM_SECRET) {
		console.log(
			'Failed Stream Connection: '+ request.socket.remoteAddress + ':' +
			request.socket.remotePort + ' - wrong super secret.'
		);
		response.end();
	}

	// TEST LIMIT
	if (STREAM_ARRAY.length > 0) {
		console.log(
			'Failed Stream Connection: '+ request.socket.remoteAddress + ':' +
			request.socket.remotePort + ' - reached limit.'
		);
		response.end();
	}

	response.connection.setTimeout(0);

	console.log('Stream ID added to the STREAM_ARRAY : ' + params[1]);
	console.log('Stream Connected: ' + request.socket.remoteAddress + ':' +request.socket.remotePort);

	STREAM_ARRAY.push(params[1]);
	console.log('STREAM_ARRAY : ' + STREAM_ARRAY[0]);

	request.on('close', function(e){
		console.log('EXPERIMENTAL close: ' + STREAM_ARRAY[0]);
	});

	request.on('data', function(data){
		socketServer.broadcast(data);
		if (request.socket.recording) {
			request.socket.recording.write(data);
		}
	});
	request.on('end',function(e) {
		console.log('close stream request ! e -> ', e);
		console.log('close stream request ! sloce socket etst -> ', request.socket.close);

		// TEST 
		/* var index = STREAM_ARRAY.indexOf(item);
		if (index !== -1) {
			array.splice(index, 1);
		} */

		if (request.socket.recording) {
			request.socket.recording.close();
		}
	});

	// Record the stream to a local file?
	if (RECORD_STREAM) {
		var path = 'recordings/' + Date.now() + '.ts';
		request.socket.recording = fs.createWriteStream(path);
	}
}).listen(STREAM_PORT);

console.log('Listening for incomming MPEG-TS Stream on http://127.0.0.1:'+STREAM_PORT+'/<secret>');
console.log('Awaiting WebSocket connections on ws://127.0.0.1:'+WEBSOCKET_PORT+'/');
