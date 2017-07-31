/**
 * Created by marcelmaas on 10/03/2017.
 */
 // --- PACKAGE-IMPORTS ---
import * as path from 'path';
import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import * as cookieParser from 'cookie-parser';
import auth from './auth';

// --- CONFIG-IMPORTS ---
// Load Mongoose config file for connecting to MongoDB instance
import {MongooseConnection} from "./config/mongoose.conf";

// --- ROUTE-IMPORTS ---
// Importing routes
import {DemoRouter} from './routes/_demo.router';
import {AuthRouter} from "./routes/_auth.router";


// Creates and configures an ExpressJS web server.
class App {

    // ref to Express instance
    public express: express.Application;

    //Run configuration methods on the Express instance.
    constructor() {
        //         // Pass mongoose configuration the Mongoose instance
        new MongooseConnection(mongoose);

        this.express = express();
        this.middleware();
        this.routes();
    }

    // Configure Express middleware.
    private middleware(): void {
        this.express.use(logger('dev'));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
        // --- AUTH-MIDDLEWARE ---
        this.express.use(cookieParser(process.env.COOKIE_SECRET));
        this.express.use(auth.initialize());

    }

    // Configure API endpoints.
    private routes(): void {
        let router = express.Router();

        this.express.use('/api', router);

        // Route to handle all Angular requests
        this.express.get('*', (req, res, next) => {
            // Load our src/app.html file
            //** Note that the root is set to the parent of this folder, ie the app root **
            res.sendFile('/dist/index.html', { root: __dirname + "/../"});
        });
        // --- ROUTES ---
        router.use("/demo", new DemoRouter().router);
        router.use("/auth", new AuthRouter(auth).router);

    }

}

export default new App().express;







