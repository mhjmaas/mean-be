/**
 * Created by marcelmaas on 10/03/2017.
 * based on https://gist.github.com/brennanMKE/ee8ea002d305d4539ef6
 */

import * as mongoose from 'mongoose';

export let Schema = mongoose.Schema;
export let ObjectId = mongoose.Schema.Types.ObjectId;

export interface IDemo extends mongoose.Document {
    name: String;
    type: String;
    createdAt: Date;
    modifiedAt: Date;
}

export interface IDemoModel extends IDemo, mongoose.Document {}

export const DemoSchema  = new Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type:String,
        required: true
    },
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
        let doc = <IDemoModel>this._doc;
        let now = new Date();
        if (!doc.createdAt) {
            doc.createdAt = now;
        }
        doc.modifiedAt = now;
    }
    next();
    return this;
});

const Demo = mongoose.model<IDemoModel>('Demo', DemoSchema, 'demoes', true);
export default Demo;