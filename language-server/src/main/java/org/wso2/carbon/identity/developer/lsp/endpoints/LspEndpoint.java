/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package org.wso2.carbon.identity.developer.lsp.endpoints;

import org.wso2.carbon.identity.developer.lsp.LanguageProcessor;
import org.wso2.carbon.identity.developer.lsp.LanguageProcessorFactory;
import org.wso2.carbon.identity.jsonrpc.ErrorResponse;
import org.wso2.carbon.identity.jsonrpc.JsonRPC;
import org.wso2.carbon.identity.jsonrpc.Request;
import org.wso2.carbon.identity.jsonrpc.Response;

import java.io.IOException;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

/**
 * The entry endpoint for language server.
 */

@ServerEndpoint("/lsp")
public class LspEndpoint {

    private JsonRPC jsonRPC;
    private LanguageProcessorFactory languageProcessorFactory;

    public LspEndpoint() {

        this.jsonRPC = new JsonRPC();
        jsonRPC.init();

        this.languageProcessorFactory = new LanguageProcessorFactory();
        languageProcessorFactory.init();
    }

    /**
     * Method is called when a connection is established.
     *
     * @param session
     */
    @OnOpen
    public void onOpen(Session session) {

        System.out.println(session.getId() + " has opened a connection");
        try {
            session.getBasicRemote().sendText("Connection Established");
        } catch (IOException ex) {
            ex.printStackTrace();
        }
    }

    /**
     * Method is called when user closes the connection.
     * <p>
     * Note: You cannot send messages to the client from this method
     */
    @OnClose
    public void onClose(Session session) {

        System.out.println("Session " + session.getId() + " has ended");
    }

    /**
     * Method is called when a user sends a message to this server endpoint.
     * Method intercepts the message and allows us to react accordingly.
     */
    @OnMessage
    public void onMessage(String message, Session session) {

        System.out.println("Message from " + session.getId() + ": " + message);

        try {

            Request request = jsonRPC.decode(message);
            LanguageProcessor languageProcessor = languageProcessorFactory.getProcessor(request);
            Response response;
            if(languageProcessor == null) {
                //TODO: Descriptive error, no processor found
                response = new ErrorResponse();
            } else {
                response = languageProcessor.process(request);
            }
            if(response == null) {
                //TODO: Descriptive error
                response = new ErrorResponse();
            }
            session.getBasicRemote().sendText(jsonRPC.encode(response));
        } catch (IOException ex) {
            ex.printStackTrace();
        }
    }

    /**
     * Method is called when an error occurs.
     *
     * @param e
     */
    @OnError
    public void onError(Throwable e) {

        e.printStackTrace();
    }

}
