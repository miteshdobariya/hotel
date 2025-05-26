const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const schema = new Schema({

    name:({
        type:String
    }),
    detail:({
        type:String
    }),

    image:({
        type:String
    }),

    mobile:({
        type:String
    }),

    checkin:({
        type:String
    }),

    checkout:({
        type:String
    })


})

const MyModel = mongoose.model('room', schema);
module.exports = MyModel