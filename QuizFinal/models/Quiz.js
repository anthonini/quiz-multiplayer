var mongoose = require('mongoose');

// Document schema for Discipline
exports.QuizSchema = new mongoose.Schema({
	name: String,
	questionsQuantity: String,
	time: String,
	selectQuestionsMode: String,
	questions: [],
	professor: String,
	discipline: String
});