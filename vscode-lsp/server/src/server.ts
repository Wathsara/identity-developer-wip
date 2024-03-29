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

import * as vscode from 'vscode';
import * as rpc from 'vscode-ws-jsonrpc';
import * as server from 'vscode-ws-jsonrpc/lib/server';
import { stringify } from 'querystring';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

declare var text : String;

connection.onInitialize((params: InitializeParams) => {	
	let capabilities = params.capabilities;
	// Does the client support the `workspace/configuration` request?
	// If not, we will fall back using global settings
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	return {
		capabilities: {
			textDocumentSync: documents.syncKind,
			// Tell the client that the server supports code completion
			completionProvider: {
				resolveProvider: true
			}
		}
	};
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}	
});

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.languageServerExample || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'languageServerExample'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

var text:String;

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
	text = change.document.getText();
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {

	// In this simple example we get the settings for every validate run.
	let settings = await getDocumentSettings(textDocument.uri);	

	// The validator creates diagnostics for all uppercase words length 2 and more
	let text = textDocument.getText();

	var WebSocket = require('ws');
	var webSocket = new WebSocket('ws://localhost:8080/lsp/lsp');		
	var obj:any = {
		"text" : text,			
	};
	var output = <JSON>obj;
	// rpc.listen({
	// 	webSocket,
	// 	onConnection: (rpcConnection: rpc.MessageConnection) => {
	// 		const notification = new rpc.NotificationType<any, void>('validate');
	// 		rpcConnection.listen();				
	// 		rpcConnection.sendNotification(notification, JSON.stringify(output));
	// 		console.log("yawwa spaams+ " + output);
	// 	},
	// });	

	// await webSocket.on('message', function incoming(data: any) {				
	// 	console.log("Recieved "+data);
	// 	console.log("Recieved data type "+ typeof data);
	// 	let obj = JSON.parse(data);
	// 	console.log("Recieved id type "+ obj.id);
	// 	recieveData = obj.id;			
	// });	

	let pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

	let problems = 0;
	let diagnostics: Diagnostic[] = [];
	while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
		problems++;
		let diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} is all Uppercase.`,
			source: 'ex'
		};
		if (hasDiagnosticRelatedInformationCapability) {
			diagnostic.relatedInformation = [
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Spelling matters'
				},
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Particularly for names'
				}
			];
		}
		diagnostics.push(diagnostic);
	}
	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});
var recieveData:any = "hi";
// This handler provides the initial list of the completion items.
let completionList:CompletionItem[] = [];
connection.onCompletion(
	async (_textDocumentPosition: TextDocumentPositionParams): Promise<CompletionItem[]> => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.		
		var WebSocket = require('ws');
		var webSocket = new WebSocket('ws://localhost:8080/lsp/lsp');		
		var obj:any = {
			"text" : text,
			"line" : _textDocumentPosition.position.line+1,
			"character":_textDocumentPosition.position.character
		};
		var output = <JSON>obj;
		rpc.listen({
			webSocket,
			onConnection: (rpcConnection: rpc.MessageConnection) => {
				const notification = new rpc.NotificationType<any, void>('onCompletion');
				rpcConnection.listen();				
				rpcConnection.sendNotification(notification, JSON.stringify(output));
				console.log("yawwa spaams+ " + output);				
			},
		});	

		await webSocket.on('message', function incoming(data: any) {				
			console.log("Recieved "+data);
			console.log("Recieved data type "+ typeof data);
			let obj = JSON.parse(data);			
			console.log("Recieved id type "+ JSON.stringify(obj.result.re));
			recieveData = obj.result;	
			var jsonData = JSON.parse(JSON.stringify(obj.result.re));
			completionList=[];
			for (var i = 0; i < jsonData.length; i++) {
				var counter = jsonData[i];
				var jsonob = {
					label: String(counter.label),
					kind: counter.kind,
					data: 1,
					insertText: counter.insertText
				};
				completionList.push(jsonob);
				console.log(counter.id);
			}		
		});	

		var initialize = "null";
		return completionList;
		

	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = 'TypeScript details';
			item.documentation = 'TypeScript documentation';
		} else if (item.data === 2) {
			item.detail = 'JavaScript details';
			item.documentation = 'JavaScript documentation';
		}
		return item;
	}
);

/*
connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.text the initial full content of the document.
	connection.console.log(`${params.textDocument.uri} opened.`);
});
connection.onDidChangeTextDocument(onInitialize(params) => {
	// The content of a text documeonInitializent did change in VSCode.
	// params.uri uniquely identifionInitializees the document.
	// params.contentChanges descrionInitializebe the content changes to the document.
	connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});

connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.uri uniquely identifies the document.
	connection.console.log(`${params.textDocument.uri} closed.`);
});
*/

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
