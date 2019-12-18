var mongoose = require('mongoose');

// Document schema for Discipline
exports.DisciplineSchema = new mongoose.Schema({
	name: String,
	subjects: [],
	privateContent: Boolean,
	professor: String
	
});