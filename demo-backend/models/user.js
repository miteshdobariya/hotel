const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    username:({
        type:String
    }),
    email:({
        type:String,
        unique:true,
    }),
    password:({
        type:String
    })


   
})

const MyModel = mongoose.model('registrations', schema);
module.exports = MyModel

