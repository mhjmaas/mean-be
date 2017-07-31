/**
 * Created by marcelmaas on 10/03/2017.
 */
 // -- IMPORTS --
import * as express from 'express';
import Demo from "../model/demo.model";

export class DemoRouter {
    public router: express.Router;

    /**
     * Initialize the DemoRouter
     */
    constructor() {
        this.router = express.Router();
        this.init();
    }

    /**
     * GET all data.
     */
    public getAll(req: express.Request, res: express.Response, next: express.NextFunction) {
        // --- DEMO-GET-ALL ---
        res.json([]);
    }

    /**
     * GET one date by name
     */
    public getOne(req: express.Request, res: express.Response, next: express.NextFunction) {
        let query = parseInt(req.params.id);
        let hero = "First"; // logic here
        if (hero) {
            res.status(200)
                .send({
                    message: 'Success',
                    status: res.status,
                    hero
                });
        }
        else {
            res.status(404)
                .send({
                    message: 'No hero found with the given id.',
                    status: res.status
                });
        }
    }

    /**
     * Take each handler, and attach to one of the Express.Router's
     * endpoints.
     */
    init() {
        this.router.get('/', (request: express.Request, response: express.Response, next: express.NextFunction) => this.getAll(request, response, next));
        this.router.get('/:id', (request: express.Request, response: express.Response, next: express.NextFunction) => this.getOne(request, response, next));
    }

}
