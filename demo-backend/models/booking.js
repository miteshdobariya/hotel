const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const schema = new Schema({

    room_id:({
        type:mongoose.Types.ObjectId
    }),

    roomname:({
        type:String
    }),

    email:({
        type:String
    }),

    checkin:({
        type:String
    }),

    checkout:({
        type:String
    })


})

const MyModel = mongoose.model('book', schema);
module.exports = MyModel