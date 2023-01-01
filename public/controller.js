
/**
 * @author Nikola Lukic
 * @description Remote Desktop XY Coordinator
 * for WebControlSystem. Writen in ECMA5 Vanilla JS.
 * @licence GPL v3
 */

function initCoordinator(instanceId) {

  var wsProtocol = 'ws';
  if(window.location.protocol.indexOf("https") != -1) {
    wsProtocol = 'wss';
  }

  var button = document.querySelector("button"),
    output = document.querySelector("#output"),
    textarea = document.querySelector("textarea"),
    wsUri = wsProtocol + "://" + window.location.hostname + ":20002/" + instanceId,
    controller = new WebSocket(wsUri);

  // make it global
  window.controller = controller;

  let remoteScreen = document.querySelector("#video-canvas");
  // remoteScreen.addEventListener("click", _n);
  remoteScreen.addEventListener("mousedown", _n);
  remoteScreen.addEventListener("mouseup", _up);
  window.addEventListener("mousemove", _i);

  controller.onopen = function(e) {
    writeToScreen("status: connected => ", e);
    doSend("WebSocket controller");
  };

  controller.onclose = function(e) {
    console.log("status disconnected ->", e);
    /**
     * @description
     * Kill page
     * */
    if(window.location.protocol == 'http:') window.location.href = "http://maximumroulette.com:8080/?r=stream-shutdown-by-host";
    if(window.location.protocol == 'https:') window.location.href = "https://maximumroulette.com:8080/?r=stream-shutdown-by-host";
  };

  controller.onmessage = function(e) {
    writeToScreen("success:" + e.data);
  };

  controller.onerror = function(e) {
    writeToScreen("<span class=error>ERROR:</span> " + e.data);
  };

  function doSend(message) {
    // writeToScreen("SENT: " + message);
    try {
      controller.send(message);
    } catch(err) {
      console.warn('Redirect now...');
    }
  }

  function writeToScreen(message) {
    output.innerHTML = "<div>" + message + "</div>";
  }

  // right
  function _up(e) {
    switch(e.which) {
      case 1:
        console.log('Left Mouse button pressed2.');
        var detRealZeroAxis = window.outerHeight - window.innerHeight;
        var Y = parseFloat(e.clientY) - parseFloat(detRealZeroAxis);
        simple = "W_CLUP:" + e.clientX + "-" + Y;
        break;
      case 2:
        console.log('Middle Mouse button pressed2.');
        simple = "W_CMUP:" + e.clientX + "-" + e.clientY;
        break;
      case 3:
        console.log('Right Mouse button pressed2.');
        simple = "W_CRUP:" + e.clientX + "-" + e.clientY;
        break;
      default:
        console.log('You have a strange Mouse2!');
    }
    doSend(simple);
  }

  // left
  function _n(e) {
    var simple;
    switch(e.which) {
      case 1:
        console.log('Left Mouse button pressed.');
        simple = "W_CL:" + e.clientX + "-" + e.clientY;
        break;
      case 2:
        console.log('Middle Mouse button pressed.');
        simple = "W_CM:" + e.clientX + "-" + e.clientY;
        break;
      case 3:
        console.log('Right Mouse button pressed.');
        simple = "W_CR:" + e.clientX + "-" + e.clientY;
        break;
      default:
        console.log('You have a strange Mouse!');
    }
    
    doSend(simple);
  }

  // move
  function _i(e) {
    var construct_point = {
      x: e.clientX,
      y: e.clientY,
    };

    var detRealZeroAxis = window.outerHeight - window.innerHeight;
    var Y = parseFloat(e.clientY) - parseFloat(detRealZeroAxis);

    var simple = e.clientX + ";" + Y;
    // doSend(JSON.stringify(construct_point));
    doSend(simple);
  }

}