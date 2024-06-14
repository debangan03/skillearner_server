const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Instructor schema
const instructorSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
});

// Define the Course schema
const courseSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  totalduration:String,
  progress:String,
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  modules: {
    type: [Object],
    required: true,
  },
  instructor: {
    type: instructorSchema,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});
module.exports =courseSchema;