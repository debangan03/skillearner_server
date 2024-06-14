const mongoose = require('mongoose');
const courseSchema = require('../schemas/courseSchema');
// Create the Course model from the schema
const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
