
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

  button.addEventListener("click", _n);
  window.addEventListener("mousemove", _i);

  controller.onopen = function(e) {
    writeToScreen("status: connected => ", e);
    doSend("WebSocket controller");
  };

  controller.onclose = function(e) {
    console.log("status disconnected ->" , e);
    /**
     * @description
     * Kill page
     * */
    if(window.location.protocol == 'http:') window.location.href = "http://maximumroulette.com:8080/?r=stream-shutdown-by-host";
    if(window.location.protocol == 'https:') window.location.href = "https://maximumroulette.com:8080/?r=stream-shutdown-by-host";
  };

  controller.onmessage = function(e) {
    // console.log("onmessage")
    writeToScreen("<span>RESPONSE: " + e.data + "</span>");
  };

  controller.onerror = function(e) {
    writeToScreen("<span class=error>ERROR:</span> " + e.data);
  };

  function doSend(message) {
    // writeToScreen("SENT: " + message);
    controller.send(message);
  }

  function writeToScreen(message) {
    output.innerHTML = "<div>" + message + "</div>";
  }

  function _n() {
    var text = textarea.value;

    text && doSend(text);
    textarea.value = "";
    textarea.focus();
  }

  function _i(e) {
    var construct_point = {
      x: e.clientX,
      y: e.clientY,
    };
    var simple = e.clientX + ";" + e.clientY;
    // doSend(JSON.stringify(construct_point));
    doSend(simple);
  }

}