
/**
 * @author Nikola Lukic
 * @description Remote Desktop XY Coordinator
 * for WebControlSystem. Writen in ECMA5 Vanilla JS.
 */

function initCoordinator() {

  var wsProtocol = 'ws';
  if (window.location.protocol.indexOf("https") != -1) {
    wsProtocol = 'wss';
  }

  var button = document.querySelector("button"),
      output = document.querySelector("#output"),
      textarea = document.querySelector("textarea"),
      wsUri = wsProtocol + "://" + window.location.hostname + ":20002",
      controller = new WebSocket(wsUri);

  button.addEventListener("click", _n);
  window.addEventListener("mousemove", _i);

  controller.onopen = function (e) {
    writeToScreen("CONNECTED");
    doSend("WebSocket controller");
  };

  controller.onclose = function (e) {
    writeToScreen("DISCONNECTED");
  };

  controller.onmessage = function (e) {
    writeToScreen("<span>RESPONSE: " + e.data + "</span>");
  };

  controller.onerror = function (e) {
    writeToScreen("<span class=error>ERROR:</span> " + e.data);
  };

  function doSend(message) {
    writeToScreen("SENT: " + message);
    controller.send(message);
  }

  function writeToScreen(message) {
    output.insertAdjacentHTML("afterbegin", "<p>" + message + "</p>");
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
    console.log(construct_point)
  }

}