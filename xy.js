/**
 * @author Nikola Lukic
 * @description Remote Desktop XY Coordinator Server
 * for WebControlSystem. Used webSocket.
 */

const fs = require("fs");
const WebSocket = require("ws");


var XYCORDSOCKS = {};
var eventEmitter;

const HttpsServer = require('https').createServer;

if (process.platform == 'win32') {
  options = {};
} else {
  options = {
    key: fs.readFileSync("/etc/letsencrypt/live/maximumroulette.com/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/maximumroulette.com/fullchain.pem")
  };
 
  console.log('# SSL FOR XY')
}

var server = HttpsServer(options, function(request, response) {

  response.connection.setTimeout(0);
  console.log('XY TEST SSL CONNECT : ' );
 
 
}).listen(20002);

const wss = new WebSocket.Server({server: server   });

var INJECTOR = function (arg) {
  eventEmitter = arg;

  eventEmitter.on('new-stream', (e) => {
    console.log('STREAM NEW XY ->>>', e.id);
  });

  eventEmitter.on('end-stream', (e) => {
    console.log('STREAM END  XY ->>>', e.id);
    console.log('STREAM END  EXPLORE1 ->>>', typeof XYCORDSOCKS[e.id]);
    console.log('STREAM END  EXPLORE2 ->>>', typeof XYCORDSOCKS[e.id + "/STREAMER"]);
    if (XYCORDSOCKS[e.id + "/STREAMER"] && XYCORDSOCKS[e.id + "/STREAMER"].close) XYCORDSOCKS[e.id + "/STREAMER"].close();
    if (XYCORDSOCKS[e.id] && XYCORDSOCKS[e.id].close) XYCORDSOCKS[e.id].close();
    console.log('STREAM END  AFTER ALL');
  });

  console.log("Emiiteter" + eventEmitter);
};

wss.createUniqueID = function () {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + "-" + s4() + "-" + s4();
};

wss.on("connection", function connection(ws, upgradeReq) {
  // console.log(`connection [XY] -> ${upgradeReq.url}`);
  var incommingSecret = upgradeReq.url.toString().substring(1);
  console.log(`Conn Url on [XY] -test incommingSecret >>>>>>>>>>>>>>>>>> ${incommingSecret}`);

  if (incommingSecret == '') {
    console.log(`[close] Conn Url on [XY] COMES FROM STREMER HOST DESK IS EMPTY POTENCILA DANGERUS ! -> ${incommingSecret}`);
    ws.close();
    return;
  }

  ws.info = {};
  ws.info.id = wss.createUniqueID();
  console.info(" New user with id -> ", ws.info);
  XYCORDSOCKS[incommingSecret] = ws;

  ws.on("message", function incoming(data) {
    var buf = Buffer.from(data);
    console.log("MESSAGE DATA -> ", buf.toString());

    if (buf.toString().indexOf("WIZARD-NIDZA-") !== -1) {
      var getID = buf.toString().replace("WIZARD-NIDZA-", "");
      // console.log("One wizard client with id -> ", getID);
      ws.info._type = "WIZARD-SERVER";
      ws.info.secret = getID;
      var constPath = "./public/secret-wizard-" + getID + ".html";
      if (!fs.existsSync(constPath)) {
        fs.copyFile("secret.html", constPath, err => {
          if (err) throw err;
          console.log("Secret link created for ", getID);
        });
        return;
      }

      /** No need TEST */
      return;
    }

    if (XYCORDSOCKS[incommingSecret].readyState === WebSocket.OPEN) {
      XYCORDSOCKS[incommingSecret].send(data);
    }

  });

  // detect close
  ws.on("close", function (code, message) {
    console.log("Disconnected XY WebSocket (code err) => ", code);
    console.log("Disconnected XY WebSocket (message err) => ", message);
  });
});

console.log("YX running.. explore XYCORDSOCKS=[] .");

wssXYCords = wss;

module.exports = {
  XYCORDSOCKS,
  INJECTOR,
  wssXYCords
};
