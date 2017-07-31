/**
 * Created by marcelmaas on 11/04/2017.
 */

var passport = require("passport");
var passportJWT = require("passport-jwt");

var cfg = require("./config/config.json");
var ExtractJwt = passportJWT.ExtractJwt;
var Strategy = passportJWT.Strategy;

export class Auth {
  constructor() {

    let params = {
      secretOrKey: cfg.JWT_SECRET,
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromExtractors([this.cookieExtractor])
    };

    let authenticationStrategy = new Strategy(params, function(payload, done) {
      // You can check the database to be sure the user has access
      // however it is always smart to make the access_token short lived and refresh if needed
      // In that case you can simply check for the expiry time (which ExtractJWT does for us)

      // so when there is no user object the validation has failed.
      var user = payload.user;
      if (user) {
        return done(null, user);
      } else {
        return done(new Error("User not found"), null);
      }
    });
    passport.use(authenticationStrategy);
  }

  private cookieExtractor(req){
    var token = null;
    if (req && req.signedCookies){
      token = req.signedCookies['access_token'];
    }
    return token;
  }

  initialize() {
    return passport.initialize();
  }

  authenticate() {
    return passport.authenticate("jwt", {
      session: false
    });
  }
}

export default new Auth();
