var mongoose = require('mongoose');

// Document schema for Subject
exports.SubjectSchema = new mongoose.Schema({
	name: String,
	questions: [],
	discipline: String
	
});