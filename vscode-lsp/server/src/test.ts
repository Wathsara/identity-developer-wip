/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
	createConnection,
	TextDocuments,
	TextDocument,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams
} from 'vscode-languageserver';

import * as rpc from 'vscode-ws-jsonrpc';

var WebSocket = require('ws');
var webSocket = new WebSocket('ws://localhost:8080/lsp/lsp');

rpc.listen({
	webSocket,
	onConnection: (rpcConnection: rpc.MessageConnection) => {
		console.log("hello");
		const notification = new rpc.NotificationType<Array<any>, void>('onInitialize');
		rpcConnection.listen();
		rpcConnection.sendNotification(notification, [1,2,3]);
		rpcConnection.onNotification(notification, (param: any) => {
			console.log("awa paams+ " + param); // This prints Hello World
		});
		// console.log(data);
	}
});

// const socket: rpc.IWebSocket = new WebSocket('ws://localhost:8080/lsp/lsp');
// const reader = new rpc.WebSocketMessageReader(socket);
// const writer = new rpc.WebSocketMessageWriter(socket);
// const logger = new rpc.ConsoleLogger();
// const connection = rpc.createMessageConnection(reader, writer, logger);
// const notification = new rpc.NotificationType<string, void>('onInitialize');
// connection.onNotification(notification, (param: any) => {
// 	console.log(param); // This prints Hello World
// });

