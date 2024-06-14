const mongoose = require('mongoose');
const courseSchema = require('./courseSchema');

const orderSchema = new mongoose.Schema({
    oid:String,
    cid:String,
    amount:String,
    email:String,
    paystatus:{
        type:String,
        default:"initiated",
    },
    course:courseSchema,
})

module.exports = orderSchema;