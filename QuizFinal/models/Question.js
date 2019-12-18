var mongoose = require('mongoose');

// Subdocument schema for votes
var voteSchema = new mongoose.Schema({ ip: 'String' });

// Subdocument schema for question choices
var choiceSchema = new mongoose.Schema({
	text: String,
	correct: Boolean,
	answers: [voteSchema]
});

// Document schema for Questions
exports.QuestionSchema = new mongoose.Schema({
	text: { type: String, required: true },
	choices: [choiceSchema],
	subject: String
});