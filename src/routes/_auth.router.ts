/**
 * Created by marcelmaas on 11/04/2017.
 */
import * as express from 'express';

import {isNullOrUndefined} from "util";
import * as crypto from 'crypto';
import User, {Role} from "../model/user.model";
import {MailUtil} from "../util/mail.module";

var cfg = require("../config/config.json");
var jwt = require("jsonwebtoken");

export class AuthRouter {
  public router: express.Router;

  private static ACCES_TOKEN_EXPIRY_TIME:number = 60*20; // 20 minutes

  /**
   * Initialize the DemoRouter
   */
  constructor(auth) {
    this.router = express.Router();
    this.init(auth);
  }

  /**
   * Take each handler, and attach to one of the Express.Router's
   * endpoints.
   */
  init(auth) {
    this.router.post('/login', (request: express.Request, response: express.Response, next: express.NextFunction) => this.login(request, response, next));
    this.router.post('/logout', auth.authenticate(), (request: express.Request, response: express.Response, next: express.NextFunction) => this.logout(request, response, next));
    this.router.post('/signup', (request: express.Request, response: express.Response, next: express.NextFunction) => this.signup(request, response, next));
    this.router.get('/user', auth.authenticate(), (request: express.Request, response: express.Response, next: express.NextFunction) => this.getUser(request, response, next));
    this.router.post('/token', this.validateRefreshToken, (request: express.Request, response: express.Response, next: express.NextFunction) => this.postToken(request, response, next));
    this.router.post('/token/reject', auth.authenticate(), (request: express.Request, response: express.Response, next: express.NextFunction) => this.rejectToken(request, response, next));
    this.router.post('/forgot', (request: express.Request, response: express.Response, next: express.NextFunction) => this.forgotPassword(request, response, next));
    this.router.post('/reset', (request: express.Request, response: express.Response, next: express.NextFunction) => this.resetPassword(request, response, next));
  }

  public signup(req: express.Request, res: express.Response, next: express.NextFunction) {
    User.findOne({

      // Model.find `$or` Mongoose condition
      $or : [

        { 'username' : req.body.username.toLowerCase() },

        { 'email' : req.body.email.toLowerCase() }
      ]
    }, (err, user) => {

      // If there are any errors, return the error
      if (err)
        res.json({
          success: false,
          msg: err
        });

      // If a user exists with either of those ...
      if(user) {

        // ### Verify Callback

        // Invoke `done` with `false` to indicate authentication
        // failure
        return res.json({
          success: false,
          msg: 'That username/email is already taken.'
        });

      } else {

        // If there is no user with that email or username...

        // Create the user
        let newUser = new User();
        process.nextTick(() => {
          User.find().limit(1).exec(function (err, results) {
            var count = results.length;
            if (count === 0) {
              newUser.roles.push(new Role("admin"));
            }
            newUser.roles.push(new Role("user"));


            // Set the user's local credentials

            // Combat case sensitivity by converting username and
            // email to lowercase characters
            newUser.username = req.body.username.toLowerCase();

            newUser.email = req.body.email.toLowerCase();

            // Hash password with model method
            newUser.password = newUser.generateHash(req.body.password);

            newUser.name = req.body.name;


            // Save the new user
            newUser.save((err) => {

              if (err)
                throw err;

              res.json({
                success: true,
                result: newUser
              });
            });
          });
        });
      }
    });
  }

  /**
   * GET all data.
   */
  public login(req: express.Request, res: express.Response, next: express.NextFunction) {
    let router = this;
    if (req.body.username && req.body.password) {
      var username = req.body.username;
      var password = req.body.password;

      // Combat case sensitivity by converting username to lowercase
      // characters
      User.findOne({

        // Model.find `$or` Mongoose condition
        $or : [

          { 'username' : username.toLowerCase() },

          { 'email' : username.toLowerCase() }
        ]
      }, (err, user) => {

        // If there are any errors, return the error before anything
        // else
        if (err)
        {
          res.status(401);
          return res.json({
            success: false,
            msg: err
          });
        }


        // If no user is found, return a message
        if (!user || !user.validPassword(password)) {
          res.status(401);
          return res.json({
            success: false,
            msg: "Login failed"
          });
        }

        var token = this.generateAccessToken(user);
        var refreshToken;
        if (req.query.permanent === 'true'){
          // sample below of how to generate and save an refreshToken
          var refreshToken = undefined;
          // save the client for the user
          if (req.query.permanent === 'true'){
            refreshToken = user._id + '.' + crypto.randomBytes(
                40).toString('hex');

            User.findOneAndUpdate(
              {_id: user._id},
              {
                $push: {
                  clients :
                    {name: req.body.client, refreshToken: refreshToken, lastUsed: Date.now()}
                }
              },
              {upsert: true},
              function(err, usr){
                // now remove the oldest saved refreshToken, there is a maximum of five
                router.checkClientRemoval(usr);
              });

          }
          res.cookie("refresh_token", refreshToken, {secure: true, httpOnly: true, signed: true, expires: new Date(new Date().getTime() + (1000 * 60*60*24*365))}); // 1 year
        }
        // remove the token from the user object
        this.setAccessCookie(res, token);
        // Otherwise all is well; return successful user
        return res.json({
          succes: true,
          user: user
        });
      });



    } else {
      return res.sendStatus(401);
    }
  }

  public logout(req: express.Request, res: express.Response, next: express.NextFunction) {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.status(200);
    res.json({});
  }

  public getUser(req: any, res: express.Response, next: express.NextFunction){
    User.findOne({

      // Model.find `$or` Mongoose condition
       '_id' : req.user._id
    }, (err, user) => {

      // If there are any errors, return the error before anything
      // else
      if (err) {
        res.status(401);
      }
      res.json(user);
    });
  }

  public postToken(req: any, res: express.Response, next: express.NextFunction){
    if (req.user){
      let newToken = this.generateAccessToken(req.user);
      this.setAccessCookie(res, newToken);
      res.status(201);
    }
    res.json(req.user);
  }

  public rejectToken(req: any, res: express.Response, next: express.NextFunction) {
    User.update(
      {_id: req.body.id},
      {
        $pull: {
          clients :
            {refreshToken: req.body.refreshToken}
        }
      },
      {safe: true, upsert: true},
      function(err, usr){
        if (err){
          return next(err);
        }
        res.sendStatus(204).end();
      });
  }

  public forgotPassword(req: express.Request, res: express.Response, next: express.NextFunction) {
    // first see if the user exists in the DB
    User.findOne({ 'email' : req.body.email.toLowerCase()}, function(err,user){
      if (!err && user !== null){
        var token =crypto.randomBytes(
          20).toString('hex');

        User.findOneAndUpdate({ 'email' : req.body.email.toLowerCase()}, {
          $set:{
            "resetPasswordToken" : token,
            "resetPasswordExpires" : Date.now() + 3600000
          }
        }, function(err,user){

          new MailUtil().sendResetMail(user, "https://"+req.headers.host+"/reset/"+token, function(mailRes){
            if (mailRes === "ok"){
              res.json({ result: "ok" , message: user.resetPasswordToken});
            } else {
              res.json({ result: "error" , message: "Kon de email niet verzenden, neem contact op met beheerders"});
            }
          });
        })
      } else {
        res.json({ result: "error" , message: "Geen gebruiker gevonden voor dit email adres"});
      }
    });
  }

  public resetPassword(req: express.Request, res: express.Response, next: express.NextFunction) {
    User.findOne({'resetPasswordToken' : req.body.resetPasswordToken, 'resetPasswordExpires': { $gt: Date.now() }}, function(err,user){
      if (!err && user !== null){
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        if (req.body.password !== undefined && req.body.password !== null && req.body.password.length >= 6) {
          user.password = user.generateHash(req.body.password);
          user.save();

          new MailUtil().sendResetDoneMail(user, function(){
            res.json({ result: "ok" });
          });
        } else {
          user.save();
          res.json({ result: "error" , message: "Uw wachtwoord is te kort"});
        }

      } else {
        res.json({ result: "error" , message: "Geen gebruiker gevonden voor dit email adres"});
      }
    })
  }

  setAccessCookie(res, token){
    res.cookie("access_token", token, {secure: true, httpOnly: true, signed: true, expires: new Date(new Date().getTime() + (1000 * AuthRouter.ACCES_TOKEN_EXPIRY_TIME))});
  }

  validateRefreshToken(req: any, res: express.Response, next: express.NextFunction){
    var refreshToken;

    if (req && req.signedCookies){
      refreshToken = req.signedCookies['refresh_token'];
    }
    if (isNullOrUndefined(refreshToken) || refreshToken.split(".").length != 2) {
      console.log("undefined or not splittable");
      res.status(401).json({ error: "invalid token"});
      next();
    } else {
      // now find the user by its id, and return a new cookie for use in the auth
      // Example of finding a user by its token id and updating the lastused of the current refreshtoken
      User.findOne({ "_id" : refreshToken.split(".")[0] ,  "clients.refreshToken" : refreshToken}, function(err,user){
        if (err){
          return next(err);
        }
        if (user === undefined || user === null){
          console.log("user not found");
          res.status(401).json({ error: "invalid token"});
        } else {
          req.user = user;
          User.findOneAndUpdate({"_id" : refreshToken.split(".")[0], "clients.refreshToken" : refreshToken},
            {"clients.$.lastUsed" : Date.now()}, function(err,user){
              next();
            });

        }

      });
    }
  }

  generateAccessToken(user){

    var permissions = ["user"];
    if (user.role === "admin"){
      permissions.push("admin");
    }

    return jwt.sign({
        user: user,
        permissions: permissions
      }, cfg.JWT_SECRET,
      {
        expiresIn: AuthRouter.ACCES_TOKEN_EXPIRY_TIME
      });
  }

  private checkClientRemoval(usr):void {
    if (usr.clients.length >5){
      var oldestId = null;
      var lastUsed = null;
      usr.clients.forEach(function(client){
        if (oldestId === null){
          oldestId = client._id;
          lastUsed = client.lastUsed;
        } else {
          if (client.lastUsed < lastUsed) {
            oldestId = client._id;
            lastUsed = client.lastUsed;
          }
        }
      });
      if (oldestId !== null){
        var ObjectId = require('mongoose').Types.ObjectId;
        console.log("removing: " + usr._id);
        console.log("oldestid: " + oldestId);
        User.update(
          {_id: new ObjectId(usr._id)},
          {
            $pull: {
              clients :
                {_id: new ObjectId(oldestId)}
            }
          },
          {safe: true}, function(err, data){
          });
      }
    }
  }

}