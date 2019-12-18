// Connect to MongoDB using Mongoose
var mongoose = require('mongoose');
var util     = require("util");
var sessionId;

var db;
if (process.env.VCAP_SERVICES) {
   var env = JSON.parse(process.env.VCAP_SERVICES);
   db = mongoose.createConnection(env['mongodb-2.2'][0].credentials.url);
} else {
   db = mongoose.createConnection('localhost', 'quizzApp');
}

// Get Poll schema and model
var PollSchema = require('../models/Poll.js').PollSchema;
var Poll = db.model('polls', PollSchema);

//Get Question schema and model
var QuestionSchema = require('../models/Question.js').QuestionSchema;
var Question = db.model('questions', QuestionSchema);

//Get Subject schema and model
var SubjectSchema = require('../models/Subject.js').SubjectSchema;
var Subject = db.model('subjects', SubjectSchema);

//Get Discipline schema and model
var DisciplineSchema = require('../models/Discipline.js').DisciplineSchema;
var Discipline = db.model('disciplines', DisciplineSchema);

//Get Discipline schema and model
var QuizSchema = require('../models/Quiz.js').QuizSchema;
var Quiz = db.model('quizes', QuizSchema);

var Accountdb = require('../models/account.js');

var sessionQuestions;
var remotePlayers = [];
var inicial;
var gameSessionId;

// Main application view
exports.index = function(req, res) {
	res.render('index');
};

// JSON API for list of polls
exports.list = function(req, res) {
	//util.log("Entrei no exportsList");
	// Query Mongo for polls, just get back the question text
	Poll.find({}, 'question', function(error, polls) {
		res.json(polls);
	});
};

// JSON API for getting a single poll
exports.poll = function(req, res) {
	//util.log("Entrei no exportsPoll");
	// Poll ID comes in the URL
	var pollId = req.params.id;
	
	// Find the poll by its ID, use lean as we won't be changing it
	Poll.findById(pollId, '', { lean: true }, function(err, poll) {
		if(poll) {
			var userVoted = false,
					userChoice,
					totalVotes = 0;

			// Loop through poll choices to determine if user has voted
			// on this poll, and if so, what they selected
			for(c in poll.choices) {
				var choice = poll.choices[c]; 

				for(v in choice.votes) {
					var vote = choice.votes[v];
					totalVotes++;
					if(vote.ip === (sessionId)) {
						userVoted = true;
						userChoice = { _id: choice._id, text: choice.text };
					}
				}
			}
//			util.log("Votou: "+userVoted);
			// Attach info about user's past voting on this poll
			poll.userVoted = userVoted;
			poll.userChoice = userChoice;
			poll.totalVotes = totalVotes;
		
			res.json(poll);
		} else {
			res.json({error:true});
		}
	});
};

//JSON API for creating a new poll
exports.create = function(req, res) {
	//util.log("Entrei no exportsCreate");
	var reqBody = req.body,
			// Filter out choices with empty text
			choices = reqBody.choices.filter(function(v) { return v.text != ''; }),
			// Build up poll object to save
			pollObj = {question: reqBody.question, choices: choices};
				
	// Create poll model from built up poll object
	var poll = new Poll(pollObj);
	
	// Save poll to DB
	poll.save(function(err, doc) {
		if(err || !doc) {
			throw 'Error';
		} else {
			res.json(doc);
		}		
	});
};

exports.vote = function(socket) {
	sessionId = socket.id;
	util.log("De Fora - User ID = : "+socket.id);
	socket.on('send:vote', function(data) {
		//var ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;
		var ip = socket.id;
		util.log("User ID = : "+socket.id);
		
		Poll.findById(data.poll_id, function(err, poll) {
			var choice = poll.choices.id(data.choice);
			choice.votes.push({ ip: ip });
			
			poll.save(function(err, doc) {
				var theDoc = { 
					question: doc.question, _id: doc._id, choices: doc.choices, 
					userVoted: false, totalVotes: 0, correct: doc.correctId, 
					correctAnswer: '', correctAnswered: true 
				};
				
				var correctAnswer;

				// Loop through poll choices to determine if user has voted
				// on this poll, and if so, what they selected
				for(var i = 0, ln = doc.choices.length; i < ln; i++) {
					var choice = doc.choices[i];
					if( choice.correct ){
						correctAnswer = choice.text;
					}
					for(var j = 0, jLn = choice.votes.length; j < jLn; j++) {
						var vote = choice.votes[j];
						theDoc.totalVotes++;
						theDoc.ip = ip;

						if(vote.ip === ip) {
							theDoc.userVoted = true;
							theDoc.userChoice = { _id: choice._id, text: choice.text };
							theDoc.correctAnswer = correctAnswer
							if( choice.text !=  correctAnswer){
								theDoc.correctAnswered = false;
							}
						}
					}
				}
				
				socket.emit('myvote', theDoc);
				socket.broadcast.emit('vote', theDoc);
			});			
		});
	});
	
	
	socket.on('send:newPlayer', function(data) {
		util.log("Usuario - "+ socket.id+ " conectado ao grupo");
		if( !inicial ){
			inicial = data.time;
		}
		if( !gameSessionId ){
			gameSessionId = socket.id;
		}
		data.player.id 		  	  = socket.id;
		data.player.time 	  	  = inicial;
		data.player.gameSessionId = gameSessionId;
		
		util.log("GameSessionId = "+gameSessionId)
		
		socket.emit('myNewPlayer', data.player);
		socket.broadcast.emit('newPlayer', data.player);
		if( !sessionQuestions ){
			sessionQuestions = data.questions;
		}
		data.player.sessionQuestions = sessionQuestions;
		socket.emit('sessionQuestions', data.player);
		
		for( var i = 0; i < remotePlayers.length; i++ ){
			socket.emit('newPlayer', remotePlayers[i]);
		}
		
		remotePlayers.push(data.player);
	});
		
	socket.on('send:answer', function(data) {
		Question.findById(data.question_id, function(err, question) {				
			var correctAnswer;
			// Loop through poll choices to determine if user has voted
			// on this poll, and if so, what they selected
			for(var i = 0, ln = question.choices.length; i < ln; i++) {
				var choice = question.choices[i];
				if( choice.correct ){ 
					correctAnswer = choice.text;
				}
			}
			
			var theDoc = {
					player: data.player, questionPoints: data.questionPoints, points: data.points, 
					correctAnswer: correctAnswer, correctAnswered: data.correctAnswered, 
					totalTime:data.totalTime, correctAnsweredQuestions:data.correctAnsweredQuestions,
					gameSessionId: data.gameSessionId, myResult: true
				};
			socket.emit('myAnswer', theDoc);
			theDoc.myResult = false;
			socket.broadcast.emit('answer', theDoc);
		});
	});
	
	socket.on("disconnect", function(){
		var removePlayer = playerById(socket.id);

		// Player not found
		if (!removePlayer) {
			util.log("Player not found: "+socket.id);
			return;
		};
		// Remove player from players array
		remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);

		// Broadcast removed player to connected socket clients
		this.broadcast.emit("remove player", {id: socket.id});
		
		if( remotePlayers.length == 0 ){
			sessionQuestions = false;
			inicial = false;
			gameSessionId = false;
		}
	});
	
	socket.on("disconnected", function(){
		var removePlayer = playerById(socket.id);

		// Player not found
		if (!removePlayer) {
			util.log("Player not found: "+socket.id);
			return;
		};
		// Remove player from players array
		remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);

		// Broadcast removed player to connected socket clients
		this.emit("remove player", {id: socket.id});
		this.broadcast.emit("remove player", {id: socket.id});
		if( remotePlayers.length == 0 ){
			sessionQuestions = false;
			inicial = false;
			gameSessionId = false;
		}
	});
	
	socket.on("closeSession", function(){
		sessionQuestions = false;
		inicial = false;
		gameSessionId = false;
	});
};

//Find player by ID
function playerById(id) {
	var i;
	for (i = 0; i < remotePlayers.length; i++) {
		if (remotePlayers[i].id == id)
			return remotePlayers[i];
	};
	
	return false;
};

//JSON API for get a single jogador
exports.jogador = function(req, res) {
	//util.log("Entrei no exports Jogador");
	//console.dir(req);
	var jogadorId = req.user._id;
	// Find the jogador by its ID, use lean as we won't be changing it
	Accountdb.findById(jogadorId, '', { lean: true }, function(err, jogador) {
		if(jogador) {
			res.json(jogador);
		} else {
			res.json({error:true});
		}
	});
};

//JSON API for list of accounts
exports.listAccounts = function(req, res) {
	//util.log("Entrei no exportslistAccounts");
	// Query Mongo for polls, just get back the question text
	Accountdb.find({}/*, {username:'' , tipo:''}*/, function(error, Account) {
		res.json(Account);
	});
};


//JSON API for getting a single account
exports.account = function(req, res) {
	//util.log("Entrei no exportsAccount");
	//console.dir(req);
	// Poll ID comes in the URL
	var accountId = req.params.id;
	// Find the poll by its ID, use lean as we won't be changing it
	Accountdb.findById(accountId, '', { lean: true }, function(err, account) {
		if(account) {
			res.json(account);
		} else {
			res.json({error:true});
		}
	});
};

//JSON API for updating a account
exports.saveAccount = function(req, res) {
	//util.log("Entrei no exports_saveAccount");
	var reqBody = req.body;
	var accountId = req.body._id;
	
	// Find the account by its ID
	Accountdb.findById(accountId, function(err, account) {
		if(account){
			account.nome = reqBody.nome;
			account.tipo = reqBody.tipo;
			account.email = reqBody.email;
			account.disciplines = reqBody.disciplines;
			// Update account to DB
			account.save(function(err, doc) {
				if(err || !doc) {
					throw 'Error';
				} else {
					res.json(doc);
				}		
			});
		}else{
			alert("Nao foi possivel realizar a alteracao");
		}
	});
};


//JSON API for getting a single professor
exports.professor = function(req, res) {
	//util.log("Entrei no exportsProfessor");
	//console.dir(req);
	var professorId = req.user._id;
	// Find the professor by its ID, use lean as we won't be changing it
	Accountdb.findById(professorId, '', { lean: true }, function(err, professor) {
		if(professor) {
			res.json(professor);
		} else {
			res.json({error:true});
		}
	});
};

//JSON API for getting professor disciplines
exports.professorDisciplines = function(req, res) {
	//util.log("Entrei no exportsProfessorDisciplines");
	var professorId = req.user._id;
	var disciplines = [];

	Discipline.find({professor:professorId}, {name:'' , privateContent:'', questions:'', professor:''}, function(error, disciplines) {
		res.json(disciplines);
	});
};

//JSON API for list of discipline
exports.listDisciplines = function(req, res) {
	//util.log("Entrei no exportslistDisciplines");
	// Query Mongo for disciplines, just get back the discipline name text
	Discipline.find({}, 'name',function(error, disciplines) {
		res.json(disciplines);
	});
};


//JSON API for getting a single discipline
exports.discipline = function(req, res) {
	//util.log("Entrei no exportsDiscipline");
	//console.dir(req);
	// Poll ID comes in the URL
	var disciplineId = req.params.id;
	// Find the poll by its ID, use lean as we won't be changing it
	Discipline.findById(disciplineId, '', { lean: true }, function(err, discipline) {
		if(discipline) {
			res.json(discipline);
		} else {
			res.json({error:true});
		}
	});
};

//JSON API for update or creating a new discipline
exports.createDiscipline = function(req, res) {
	//util.log("Entrei no exportsCreateDiscipline");
	var reqBody = req.body;
	var disciplineId = req.body._id;
	var discipline;
	// Find the discipline by its ID
	Discipline.findById(disciplineId, function(err, discipline) {
		if(discipline){
			discipline.name = reqBody.name;
			discipline.privateContent = reqBody.privateContent;
			discipline.questions = reqBody.questions;
		}else{
			// Build up discipline object to save
			var disciplineObj = {name: reqBody.name, privateContent: reqBody.privateContent, questions: [],
					professor: reqBody.professor};
			// Create discipline model from built up discipline object
			discipline = new Discipline(disciplineObj);
		}
		// Update or save Discipline to DB
		discipline.save(function(err, doc) {
			if(err || !doc) {
				throw 'Error';
			} else {
				res.json(doc);
			}
		});
	});
};

//JSON API for getting discipline subjects
exports.listSubjects = function(req, res) 	{
	//util.log("Entrei no exports ListSubjects");
	var disciplineId = req.params.id;
	//console.dir(req);
	Subject.find({discipline:disciplineId}, {name:'' , questions:'', discipline:''}, function(error, subjects) {
		res.json(subjects);
	});
};

//JSON API for getting a single subject
exports.subject = function(req, res) {
	//util.log("Entrei no exportsSubject");
	//console.dir(req);
	// Question ID comes in the URL
	var subjectId = req.params.id;
	// Find the question by its ID, use lean as we won't be changing it
	Subject.findById(subjectId, '', { lean: true }, function(err, subject) {
		if(subject) {
			res.json(subject);
		} else {
			res.json({error:true});
		}
	});
};

//JSON API for creating a new Subject
exports.createSubject = function(req, res) {
	//util.log("Entrei no exportsCreateSubject");
	var reqBody = req.body;
	var subjectId = req.body._id;
	
	var question;
	// Find the subject by its ID
	Subject.findById(subjectId, function(err, subject) {
		if(subject){
			subject.name = reqBody.name;
			subject.questions = reqBody.questions;
		}else{
			// Build up subject object to save
			var subjectObj = {name: reqBody.name, questions: [], discipline:reqBody.discipline};
			// Create subject model from built up subject object
			subject = new Subject(subjectObj);
		}
		// Update or save subject to DB
		subject.save(function(err, doc) {
			if(err || !doc) {
				throw 'Error';
			} else {
				res.json(doc);
			}
		});
	});
};

//JSON API for getting subject questions
exports.listQuestions = function(req, res) {
	//util.log("Entrei no exports ListQuestions");
	var subjectId = req.params.id;
	//console.dir(req);
	Question.find({subject:subjectId}, {text:'' , choices:'', subject:''}, function(error, questions) {
		res.json(questions);
	});
};

//JSON API for getting a single question
exports.question = function(req, res) {
	//util.log("Entrei no exportsQuestion");
	//console.dir(req);
	// Question ID comes in the URL
	var questionId = req.params.id;
	// Find the question by its ID, use lean as we won't be changing it
	Question.findById(questionId, '', { lean: true }, function(err, question) {
		if(question) {
			res.json(question);
		} else {
			res.json({error:true});
		}
	});
};

//JSON API for creating a new question
exports.createQuestion = function(req, res) {
	//util.log("Entrei no exportsCreateQuestion");
	var reqBody = req.body;
	var questionId = reqBody._id;
	
	// Filter out choices with empty text
	var choices = reqBody.choices.filter(function(v) { return v.text != ''; });
	
	var question;
	// Find the discipline by its ID
	Question.findById(questionId, function(err, question) {
		if(question){
			question.text = reqBody.text;
			question.choices = choices;
		}else{
			// Build up question object to save
			var questionObj = {text: reqBody.text, choices: choices, subject:reqBody.subject};
			// Create question model from built up question object
			question = new Question(questionObj);
		}
		// Update or save question to DB
		question.save(function(err, doc) {
			if(err || !doc) {
				throw 'Error';
			} else {
				res.json(doc);
			}
		});
	});
};



//JSON API for getting the list of Quiz
exports.listQuiz = function(req, res) 	{
	//util.log("Entrei no exports ListQuiz");
	//var professorId = req.user._id;
	//console.dir(professorId);
	Quiz.find({}, {name:'' , questionsQuantity:'', time:'', selectQuestionsMode:'',
		questions:'' , professor:'' ,discipline:'' }, function(error, quiz) {
		res.json(quiz);
	});
};

//JSON API for getting a single quiz
exports.quiz = function(req, res) {
	//util.log("Entrei no exports Quiz");
	//console.dir(req);
	// Quiz ID comes in the URL
	var quizId = req.params.id;
	// Find the question by its ID, use lean as we won't be changing it
	Quiz.findById(quizId, '', { lean: true }, function(err, quiz) {
		if(quiz) {
			res.json(quiz);
		} else {
			res.json({error:true});
		}
	});
};

//JSON API for creating a new quiz
exports.createQuiz = function(req, res) {
	//util.log("Entrei no exportsCreateQuiz");
	var reqBody = req.body;
	var quizId = reqBody._id;
	
	//console.dir(req);
	var quiz;
	// Find the quiz by its ID
	Quiz.findById(quizId, function(err, quiz) {
		if(quiz){
			quiz.name 				= reqBody.name;
			quiz.questionsQuantity 	= reqBody.questionsQuantity;
			quiz.time 				= reqBody.time;
			quiz.selectQuestionsMode = reqBody.selectQuestionsMode;
			quiz.questions 			= reqBody.questions;
			quiz.professor 			= reqBody.professor;
			quiz.discipline 		= reqBody.discipline;
		}else{
			// Build up quiz object to save
			var quizObj = {name:reqBody.name , questionsQuantity:reqBody.questionsQuantity,
					time:reqBody.time, selectQuestionsMode:reqBody.selectQuestionsMode,
					questions: reqBody.questions, professor:reqBody.professor, discipline:reqBody.discipline }
			// Create quiz model from built up quiz object
			quiz = new Quiz(quizObj);
		}
		// Update or save quiz to DB
		quiz.save(function(err, doc) {
			if(err || !doc) {
				throw 'Error';
			} else {
				res.json(doc);
			}
		});
	});
};
