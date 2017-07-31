/**
 * Created by marcelmaas on 26/04/2017.
 */

import * as mongoose from 'mongoose';
// Import library to hash passwords
import * as bcrypt from 'bcrypt-nodejs';

export let Schema = mongoose.Schema;
export let ObjectId = mongoose.Schema.Types.ObjectId;

export interface IUser extends mongoose.Document {
  name: String;
  email: String;
  password: String;
  username: String;
  resetPasswordToken: String;
  resetPasswordExpires: Date;
  roles: [Role];
  clients: [Client];
  createdAt: Date;
  modifiedAt: Date;
}

export class Role {
  constructor(public role:String){}
}

export class Client {
  constructor(public name: String, public _id: String, public refreshToken: String, public lastUsed: Date){}
}

export interface IUserModel extends IUser, mongoose.Document {
  generateHash(password);
  validPassword(password);
}

export const UserSchema  = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type:String,
    required: true,
    unique: true
  },
  password: {
    type:String,
    required: true
  },
  resetPasswordToken : {
    type: String ,
    required: false
  },
  resetPasswordExpires: {
    type: Date ,
    required: false,
  },
  roles : [
    {
      role: {
        type: String
      }
    }
  ],
  clients : [
    {
      name: {
        type: String
      },
      id: {
        type: String
      },
      refreshToken: {
        type: String
      },
      lastUsed: {
        type: Date
      }
    }
  ],
  createdAt: {
    type: Date,
    required: false
  },
  modifiedAt: {
    type: Date,
    required: false
  }
}).pre('save', function(next) {
  if (this._doc) {
    let doc = <IUserModel>this._doc;
    let now = new Date();
    if (!doc.createdAt) {
      doc.createdAt = now;
    }
    doc.modifiedAt = now;
  }
  next();
  return this;
});

// ### Generate a hash
UserSchema.methods.generateHash = function(password) {

  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// ### Check if password is valid
UserSchema.methods.validPassword = function(password) {

  return bcrypt.compareSync(password, this.password);
};

const User = mongoose.model<IUserModel>('User', UserSchema, 'users', true);
export default User;