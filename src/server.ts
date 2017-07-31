/**
 * Created by marcelmaas on 10/03/2017.
 */
//Load Node environment variable configuration file
// load http
// -- GENERAL-IMPORTS --
import * as https from 'https';
import * as debug from 'debug';

// -- SPECIFIC-IMPORTS --

// -- SOCKET-IMPORTS --

import {Environment} from "./config/env.conf";
// setup appropriate environment variables for this app
new Environment();

// Set the port for this app
const port = normalizePort(process.env.PORT || 8080);

// import and create thea pp
import App from './app';
App.set('port', port);

// now create the server
let httpsOptions = require('localhost.daplie.me-certificates').merge({});
const server = https.createServer(httpsOptions,App);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// -- SOCKETS-INSTANTIATION --

// -- SOCKETS-SETUP-FUNCTION --

function normalizePort(val: number|string): number|string|boolean {
    let port: number = (typeof val === 'string') ? parseInt(val, 10) : val;
    if (isNaN(port)) return val;
    else if (port >= 0) return port;
    else return false;
}

function onError(error: NodeJS.ErrnoException): void {
    if (error.syscall !== 'listen') throw error;
    let bind = (typeof port === 'string') ? 'Pipe ' + port : 'Port ' + port;
    switch(error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening(): void {
    let addr = server.address();
    let bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
    console.log(`Listening on ${bind}`);
}
