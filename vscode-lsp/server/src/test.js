"use strict";
exports.__esModule = true;
var rpc = require("vscode-ws-jsonrpc");
var WebSocket = require('ws');
// var WebSocket = new WebSocket('ws://localhost:8080/lsp/lsp');
var server = new WebSocket("ws://localhost:8080/lsp/lsp");
console.log("hello " + server);
server.on('connection', function connection(ws) {
    console.log("2. client connected");
    var connection = createMessageConnection(createRPCSocket(ws));
    connection.onError(function (_a) {
        var err = _a[0];
        return console.error("error", err.stack);
    });
    connection.onClose(function () { return console.log("CLOSED"); });
    connection.listen();
    var notification = new rpc.NotificationType('testNotification');
    connection.onNotification(notification, function (param) {
        console.log("3. got notification", param);
        console.log("4. sending request...");
        var answer = connection.sendRequest(new rpc.RequestType0("testRequest"));
        console.log("5. got testRequest answer", answer);
        console.log("DONE");
        connection.dispose();
        setTimeout(function () { return process.exit(0); }, 400);
    });
});
function createMessageConnection(socket) {
    var reader = new rpc.WebSocketMessageReader(socket), writer = new rpc.WebSocketMessageWriter(socket), logger = new rpc.ConsoleLogger(), connection = rpc.createMessageConnection(reader, writer, logger);
    return connection;
}
function createRPCSocket(websocket) {
    var onMessageCallbacks = [];
    var onErrorCallbacks = [];
    var onCloseCallbacks = [];
    var socket = {
        send: function (content) { websocket.send(content); },
        dispose: function () { websocket.close(); },
        onMessage: function (cb) { onMessageCallbacks.push(); },
        onError: function (cb) { onErrorCallbacks.push(); },
        onClose: function (cb) { onCloseCallbacks.push(); }
    };
    websocket.on('message', function (message) {
        return onMessageCallbacks.forEach(function (cb) { return cb(message); });
    });
    websocket.on('error', function (err) { return onErrorCallbacks.forEach(function (cb) { return cb(err); }); });
    websocket.on('close', function (number, reason) { return onCloseCallbacks.forEach(function (cb) { return cb(number, reason); }); });
    return socket;
}
