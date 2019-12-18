var selectedQuestions = [];
//Controller for the account list
function AccountListCtrl($scope, Account, $log, $location) {
	$log.log(new Date()+" - Entrei no AccountListController");
	$scope.accounts = Account.query();
	//console.dir($scope.accounts);
	$scope.update = function(account) {
		// Call API to save poll to the database
		account.$save(function(p, resp) {
			if(!p.error) {
				// If there is no error, redirect to the main view
				$location.path('accounts');
			} else {
				alert('Nao foi possivel cadastrar o conteudo');
			}
		});
	};
}
//Controller for the account itself
function AccountItemCtrl($scope, $routeParams, Account, $log, $location) {
	$log.log(new Date()+" - Entrei no AccountItemController");
	$scope.account = Account.get({accountId: $routeParams.accountId});
	
	$scope.update = function() {
		var account = $scope.account;
		
		// Call API to save poll to the database
		account.$save(function(p, resp) {
			$log.log(new Date()+" - Entrei no Update SAVE()");
			if(!p.error) {
				// If there is no error, redirect to the main view
				$location.path('accounts');
			} else {
				alert('Nao foi possivel cadastrar o conteudo');
			}
		});
	};
}

//Controller for the discipline list
function DisciplineListCtrl($scope, ProfessorDisciplines,DisciplineSubjects, $log, $route) {
	$log.log(new Date()+" - Entrei no DisciplineListController");
	$scope.path = $route.current.path;
	$scope.subjects = [];
	
	$scope.disciplines = ProfessorDisciplines.query(function(response){
		angular.forEach(response, function(discipline){
			$scope.subjectsAux = DisciplineSubjects.query({disciplineId: discipline._id});
			$scope.subjects.push($scope.subjectsAux);
		});
	});
}

//Controller for creating and editing discipline
function DisciplineCtrl($scope, $location, Discipline, Professor, Account, DisciplineSubjects, Subject, $log, $route, $routeParams) {
	$log.log(new Date()+" - Entrei no DisciplineController");
	$scope.path = $route.current.path;
	$scope.subjectView = 'list';
	
	$scope.professor = Professor.get(function(response){
		// Define an empty Discipline model object
		if( $scope.path === "updateDiscipline"){
			$scope.discipline = Discipline.get({disciplineId: $routeParams.disciplineId});
			$scope.subjects = DisciplineSubjects.query({disciplineId: $routeParams.disciplineId});
		}else{
			$scope.discipline = {
					name: '',
					privateContent: true,
					subjects: [],
					professor: $scope.professor._id
				};
		}
	});
	
	$scope.changeSubjectView = function(view){
		$scope.subjectView = view;
		if(view === 'register'){
			$scope.subject = {
					name: '',
					questions: [],
					discipline: $routeParams.disciplineId
				};
		}
	};
	$scope.getSubject = function(id){
		$scope.subject = Subject.get({subjectId: id});
	};
	
	// save the discipline to the database
	$scope.saveDiscipline = function() {
		$log.log(new Date()+" - Entrei no saveDiscipline");
		$scope.professorAccount = Account.get({accountId: $scope.professor._id});
		var discipline = $scope.discipline;		
		// Check that a question was provided
		if(discipline.name.length > 0) {
			var newDiscipline = new Discipline(discipline);
			// Call API to save discipline to the database
			newDiscipline.$save(function(p, resp) {
				$log.log(new Date()+" - Entrei no saveDiscipline SAVE()");
				if(!p.error) {
					if( $scope.path === "newDiscipline"){
						console.dir(newDiscipline);
						$scope.professorAccount.disciplines.push(newDiscipline._id);
						var updateAccount = new Account($scope.professorAccount);
						updateAccount.$save(function(p, resp) {
							if(!p.error) {
								$log.log(new Date()+" - Entrei no saveQuestion UPDATEAccount()");
							} else {
								alert('Nao foi possivel cadastrar a disciplina');
							}
						});
					}
					// If there is no error, redirect to the main view
					$location.path('disciplines');
				} else {
					alert('Nao foi possivel cadastrar discipina');
				}
			});
		} else {
			alert('Voce deve preencher o nome da disciplina');
		}
	};
	
	// save the subject to the database
	$scope.saveSubject = function() {
		$log.log(new Date()+" - Entrei no saveSubject()");
		var subject = $scope.subject;
		// Check that a question was provided
		if(subject.name.length > 0) {
			var newSubject = new Subject(subject);
			// Call API to save subject to the database
			newSubject.$save(function(p, resp) {
				$log.log(new Date()+" - Entrei no saveSubject $SAVE()");
				if(!p.error) {
					if( $scope.subjectView === "register"){
						console.dir(newSubject);
						$scope.discipline.subjects.push(newSubject._id);
						var updateDiscipline = new Discipline($scope.discipline);
						updateDiscipline.$save(function(p, resp) {
							if(!p.error) {
								$log.log(new Date()+" - Entrei no saveQuestion updateDiscipline()");
							} else {
								alert('Nao foi possivel cadastrar o assunto');
							}
						});
					}
					// If there is no error, redirect to the main view
					$scope.subjects = DisciplineSubjects.query({disciplineId: $routeParams.disciplineId});
					$scope.subjectView = 'list';
				} else {
					alert('Nao foi possivel cadastrar o assunto');
				}
			});
		} else {
			alert('Voce deve preencher o nome do assunto');
		}
	};
}

//Controller for see the subject questions
function SubjectItemCtrl($scope, $routeParams, Subject, SubjectQuestions, $log ) {
	$log.log(new Date()+" - Entrei no SubjectItemController");
	$scope.subject = Subject.get({subjectId: $routeParams.subjectId});
	$scope.questions = SubjectQuestions.query({subjectId: $routeParams.subjectId});
}

//Controller for creating a new question
function QuestionItemCtrl($scope, $location, $routeParams, Question, Subject, $log, $route) {
	$log.log(new Date()+" - Entrei no QuestionItemController");
	$scope.subjectId = $routeParams.subjectId;
	$scope.path = $route.current.path;
	
	if( $scope.path === "question" ){
		$scope.question = Question.get({questionId: $routeParams.questionId});
	}else{
		$scope.subject = Subject.get({subjectId: $routeParams.subjectId});
		// Define an empty question model object
		$scope.question = {
			text: '',
			choices: [ { text: '', correct: true }, { text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }],
			subject:$scope.subjectId
		};
	}
	
	$scope.setChoiceForQuestion = function (q, c) {
        angular.forEach(q.choices, function (c) {
            c.correct = false;
        });
        
        c.correct = true;
    };
	/*// Method to add an additional choice option
	$scope.addChoice = function() {
		$scope.question.choices.push({ text: '' });
	};
	*/
	// Validate and save the new Question to the database
	$scope.saveQuestion = function() {
		$log.log(new Date()+" - Entrei no saveQuestion");
		var question = $scope.question;
		
		// Check that a question was provided
		if(question.text.length > 0) {
			var choiceCount = 0;
			// Loop through the choices, make sure at least two provided
			for(var i = 0, ln = question.choices.length; i < ln; i++) {
				var choice = question.choices[i];
				if(choice.text.length > 0) {
					choiceCount++
				}
			}
			if(choiceCount >= 4 ) {
				if($scope.path === "newQuestion"){
					question.choices.push({ text: 'Sem resposta', correct: false });
				}
				// Create a new question from the model
				var newQuestion = new Question(question);
				// Call API to save question to the database
				newQuestion.$save(function(p, resp) {
					$log.log(new Date()+" - Entrei no CreateQuestion SAVE()");
					if(!p.error) {
						if($scope.path === "newQuestion"){
							console.dir(newQuestion);
							$scope.subject.questions.push(newQuestion._id);
							var updateSubject = new Subject($scope.subject);
							updateSubject.$save(function(p, resp) {
								$log.log(new Date()+" - Entrei no CreateQuestion UPDATESubject()");
								if(!p.error) {
								} else {
									alert('Nao foi possivel cadastrar o conteudo');
								}
							});
						}
						// If there is no error, redirect to the main view
						$location.path('subject/'+$scope.subjectId);
					} else {
						alert('Nao foi possivel cadastrar o conteudo');
					}
				});
			} else {
				alert('Voce deve preencher todos os campos de respostas');
			}
		} else {
			alert('Voce deve preencher o nome da questao');
		}
	};
}

//Controller for create a new Quiz
function QuizNewCtrl($scope, $log, ProfessorDisciplines, DisciplineSubjects, SubjectQuestions, Quiz, $location) {
	$log.log(new Date()+" - Entrei no QuizNewController");
	$scope.disciplines = ProfessorDisciplines.query();
	/*Disciplinas*/
	$scope.selectedDiscipline;
	/*oÃ§oes de jogo*/
	$scope.selectTimeMode = 'time';
	/*Selecionar Questoes*/
	$scope.selectedQuestions;
	$scope.selectAllCheckBox = false;
	
	$scope.quiz = {
			name: '',
			questionsQuantity: 10,
			time: 20,
			selectQuestionsMode: 'random',
			questions: [],
			professor: '',
			discipline: ''
		};
	
	
	$scope.questionsCount = 0;
	$scope.getSubjects = function(id){
		$scope.questions = [];
		$scope.subjects = DisciplineSubjects.query({disciplineId: id}, function(response){
			angular.forEach(response, function(subject){
//				console.dir(subject);
				subject.clicked=false;
				$scope.questionsAux = SubjectQuestions.query({subjectId: subject._id});
				$scope.questions.push($scope.questionsAux);
			});
		});
	};
	
	$scope.setSelectedDiscipline = function(discipline){
		$scope.selectedDiscipline = discipline;
		$scope.selectAllCheckBox = false;
	};
	
	$scope.selectAll = function(){
		angular.forEach($scope.subjects, function(subject){
			subject.selected = $scope.selectAllCheckBox;
		});
		angular.forEach($scope.questions, function(subjectQuestions){
			angular.forEach(subjectQuestions, function(question){
				question.selected = $scope.selectAllCheckBox;
			});
		});
	};
	
	$scope.selectAllSubjectQuestions = function(questions, valor){
		angular.forEach(questions, function(question){
			question.selected = valor;
		});
	};
	
	$scope.selectSubject = function(subject, subjectQuestions){
		subject.selected = false;
		angular.forEach(subjectQuestions, function(question){
			if(question.selected){
				subject.selected = true;
			}
		});
	};
	
	$scope.countQuestions = function(){
		$scope.questionsCount = 0;
		$scope.selectedQuestions = [];
		angular.forEach($scope.questions, function(questions){
			angular.forEach(questions, function(question){
				if(question.selected){
					$scope.questionsCount = $scope.questionsCount+1;
					$scope.selectedQuestions.push(question);
				}
			});
		});
		selectedQuestions = $scope.selectedQuestions;
	};
	
	$scope.updateSelectedQuestions = function(){
		$scope.selectedQuestions = selectedQuestions;
	};
	
	$scope.saveQuiz = function(){
		if( $scope.quiz.name.length > 0 ){
			if( $scope.quiz.questionsQuantity > 0 ){
				if( $scope.selectTimeMode === 'noTime' || 
						($scope.selectTimeMode === 'time' && $scope.quiz.time > 0)  ){
					if( $scope.quiz.selectQuestionsMode === 'random' && ($scope.quiz.questionsQuantity - $scope.questionsCount <= 0) || 
							($scope.quiz.selectQuestionsMode === 'fixe' && ($scope.quiz.questionsQuantity - $scope.questionsCount == 0) )){
						if( $scope.selectTimeMode === 'noTime' ){
							$scope.quiz.time = 0;
						}
						$scope.quiz.questions  = selectedQuestions;

						$scope.quiz.professor  = $scope.selectedDiscipline.professor;
						$scope.quiz.discipline = $scope.selectedDiscipline._id;
						console.dir($scope.quiz);
						var quiz = new Quiz($scope.quiz);
						quiz.$save(function(p, resp) {
							if(!p.error) {
								$log.log(new Date()+" - Entrei no saveQuestion UPDATEAccount()");
								$location.path('/quizzes');
							} else {
								alert('Nao foi possivel cadastrar a disciplina');
							}
						});
					}else{
						if( $scope.quiz.questionsQuantity - $scope.questionsCount < 0 ){
							alert("Quantidade de questões selecionadas maior do que o suficiente"+
							"Selecione menos questões ou aumente a quantidade de questões do quiz.");
						}else{
							alert("Quantidade de questões selecionadas insuficiente. " +
									"Selecione mais questões ou diminua a quantidade de questões do quiz.");
						}
					}
				}else{
					alert("Tempo de resposta do Quiz Errado");
				}
			}else{
				alert("Quantidade de Questões do Quiz Errada");
			}
		}else{
			alert("Forneça um nome para o Quiz");
		}
	};
}

//Controller for the quiz list
function QuizListCtrl($scope, Quiz, $log) {
	$log.log(new Date()+" - Entrei no QuizListController");
	$scope.quizzes = Quiz.query();
}

function QuizGameCtrl($scope, Jogador, Quiz, Question, socket, $log, $routeParams, $timeout, $location, $rootScope, $route) {
	$log.log(new Date()+" - Entrei no QuizGameController");
	$scope.jogador = Jogador.get();
	$scope.questions = [];
	$scope.quiz = Quiz.get({quizId: $routeParams.quizId}, function(response){
		angular.forEach(response.questions, function(question){
			$scope.questionAux = Question.get({questionId: question._id});
			$scope.questions.push($scope.questionAux);
		});
		if( $scope.quiz.selectQuestionsMode === "random"){
			shuffleArray($scope.questions);
		}
	});
//3207-3983	
	$scope.setQuizView = function(view){
		$scope.quizView = view;
	}
	
	$scope.setGamePlay = function(gamePlay){
		$scope.gamePlay = gamePlay;
	}
	
	$scope.doShuffle = function(array){
    	shuffleArray(array);
    };
    
    /*quiz variables*/
    $scope.points = 0;
    $scope.pointsAux = 0;
    $scope.totalTime = 0;
    var totalTime = 0;
    $scope.answer;
    $scope.correctAnswered;
    $scope.correctAnsweredQuestions = 0;
    $scope.gamePlay;
    $scope.players=[];
    $scope.connectedPlayers=[];
    $scope.userConnected=false;
    $scope.minutes, $scope.seconds, $scope.milliseconds;
    $scope.timeInMs;
    $scope.timeInSec;
    var cronometro;
    
    var inicial, finall;
    var agora;
    var contador, decrementador;
    var _segundos = 1000;
    var _minuto = _segundos * 60;
    var _hora = _minuto * 60;
    
	
	var pararContador = function(cronometro){
		$timeout.cancel(cronometro);		
	}

    var contadoRegressivo = function() {
        agora = new Date();
        decrementador = finall - agora;
        contador = agora - inicial;
        
        $scope.timeInSec = Math.floor( (decrementador) / _segundos );
        $scope.timeInMs = decrementador % _segundos;
        $scope.minutes = Math.floor( (contador % _hora) / _minuto );
        $scope.seconds = Math.floor( (contador % _minuto) / _segundos );
        $scope.milliseconds = contador % _segundos;

        cronometro = $timeout(contadoRegressivo, 50);
        if( decrementador <= 0  && $scope.quiz.time > 0){
        	$log.log(new Date()+" - Enviou o voto");
            $scope.vote($scope.question.choices[4]);
        	$scope.timeInMs = 0.0;
            $scope.timeInSec = 0.0;
            $scope.seconds = 20.0;
            $scope.milliseconds = 20.0;
        };
    };
    
    $scope.vote = function(resposta) {
		var questionId = $scope.question._id,
				choiceId = resposta._id
				
		if(questionId) {
			$scope.answer = resposta.text;
			$scope.correctAnswered = resposta.correct;
			$scope.questionPoints = 0;
			if( resposta.correct ){
				$scope.correctAnsweredQuestions = $scope.correctAnsweredQuestions+1;
				if( $scope.quiz.time > 0){
					$scope.questionPoints = ($scope.timeInMs/1000+$scope.timeInSec)*10;
				}else{
					$scope.questionPoints = 200;
				}
				$scope.pointsAux = $scope.pointsAux + $scope.questionPoints;
				$scope.points = Math.round($scope.pointsAux);
			}
			totalTime = totalTime+$scope.minutes+$scope.seconds+$scope.milliseconds/1000;
			$scope.totalTime = totalTime.toFixed(2);
			pararContador(cronometro);
			$scope.quizView = "result";
			var answerObj = { question_id: questionId, choice: choiceId, 
					player: $scope.jogador, questionPoints: Math.round( $scope.questionPoints ),
					points: $scope.points, correctAnswered: $scope.correctAnswered, totalTime: $scope.totalTime,
					correctAnsweredQuestions: $scope.correctAnsweredQuestions, gameSessionId: $scope.gameSessionId};
			
			socket.emit('send:answer', answerObj);
		} else {
			alert('You must select an option to vote for');
		}
	};

	$scope.playAgain = function(){
		shuffleArray($scope.questions);
		$scope.actualQuestionIndex = 0;
		$scope.points = 0;
	    $scope.pointsAux = 0;
	    $scope.totalTime = 0;
	    totalTime = 0;
	    $scope.correctAnsweredQuestions = 0;
	    if( $scope.gamePlay == 'singleplayer'){
	    	$scope.nextQuestion();
	    }
    };
	
    $rootScope.$on(
            "$routeChangeSuccess",
            function( $currentRoute, $previousRoute ){
                // Stop Counting.
           		$scope.userConnected = false;
        		socket.emit('disconnected');
            	pararContador(cronometro);
            }
        );
    
    $scope.connectGroup = function(){
    	var newPlayerObj = { player: $scope.jogador, questions: $scope.questions, time: new Date()};
		$scope.userConnected = true;
		socket.emit('send:newPlayer', newPlayerObj);
	}
    
    socket.on('sessionQuestions', function(data) {
    	if( $scope.gameSessionId == data.gameSessionId ){
    		$scope.questions = data.sessionQuestions;
		}
	});
    
    socket.on('myNewPlayer', function(data) {
		$scope.connectedPlayers.push(data);
		$scope.inicial = new Date(data.time);
		$scope.countTill = 30;
		$scope.gameSessionId = data.gameSessionId;
		console.dir("$scope.gameSessionId = "+$scope.gameSessionId)
		$timeout(function(){
            $timeout(waitingConnectionsCounter);
		});
	});
    
    socket.on('newPlayer', function(data) {
		if( $scope.userConnected && $scope.gameSessionId == data.gameSessionId){
			$scope.connectedPlayers.push(data);
    	}
	});
    
    var waitingConnectionsCounter = function() {
    	agora = new Date();
        contador = agora - $scope.inicial;
        $scope.seconds = Math.floor(contador/ _segundos);
        cronometro = $timeout(waitingConnectionsCounter, 50);        
        if( $scope.seconds >= $scope.countTill ){
        	socket.emit('closeSession');
        	pararContador(cronometro);
        	waitNextQuestion();
        };
    };
    
    $scope.actualQuestionIndex = 0;
    $scope.nextQuestion = function(){
    	$scope.showCount = false;
        $scope.question = $scope.questions[$scope.actualQuestionIndex];
        $scope.actualQuestionIndex = $scope.actualQuestionIndex+1;
        pararContador(cronometro);
        
        finall = (new Date()).getTime()+$scope.quiz.time*1000;
        inicial = new Date();
        
        if( $scope.actualQuestionIndex<=$scope.quiz.questionsQuantity ){
        	$scope.players=[];
        	$scope.quizView = "play";
        	$timeout(function(){
	            $timeout(contadoRegressivo);
			});
        }else{
        	$scope.makeRanking();
        	$scope.quizView = "scoreGroup";
        	$scope.userConnected = false;
        	socket.emit('disconnected');
        }
	};
	
	$scope.makeRanking = function(){
		$scope.players.sort(function(a,b){
			return(a.points < b.points);
		});
		console.dir($scope.players)
		for(var i = 0; i < $scope.players.length; i++){
			if( $scope.players[i].myResult ){
				$scope.rank = i+1;
			}
		}
	}
	
	socket.on('myAnswer', function(data) {
		$scope.correctAnswer = data.correctAnswer;
		$scope.players.push(data);
		if( $scope.connectedPlayers.length == $scope.players.length &&
				$scope.actualQuestionIndex<=$scope.quiz.questionsQuantity){
			$timeout(waitNextQuestion, 5000);
		}
	});
	
	socket.on('answer', function(data) {		
		if( $scope.gameSessionId == data.gameSessionId ){
			$scope.players.push(data);
			if( $scope.connectedPlayers.length == $scope.players.length &&
					$scope.actualQuestionIndex<=$scope.quiz.questionsQuantity){
				$timeout(waitNextQuestion, 5000);
			}
		}
	});
	
    var waitNextQuestion = function(){
    	$scope.showCount = true;
    	$scope.inicial = new Date();
		$scope.countTill = 5;
		$timeout(function(){
            $timeout(waitingNextQuestionCounter);
		});
    }
    
    var waitingNextQuestionCounter = function() {
    	agora = new Date();
        contador = agora - $scope.inicial;
        $scope.seconds = Math.floor(contador/ _segundos);
        cronometro = $timeout(waitingNextQuestionCounter, 50);        
        if( $scope.seconds >= $scope.countTill ){
        	pararContador(cronometro);
        	$scope.nextQuestion();
        };
    };
	
	socket.on("remove player", function(data){
		var removePlayer = playerById(data.id, $scope.connectedPlayers);

		// Player not found
		if (!removePlayer) {
			console.log("Player not found: "+data.id);
			return;
		};

		// Remove player from array
		$scope.connectedPlayers.splice($scope.connectedPlayers.indexOf(removePlayer), 1);
	});
}
//9605-5709
//



// Controller for the poll list
function PollListCtrl($scope, Poll, $log) {
	$log.log(new Date()+" - Entrei no PollListController");
	$scope.polls = Poll.query();
}

// Controller for an individual poll
function PollItemCtrl($scope, $routeParams, socket, Poll, $log, $timeout, $location, $rootScope) {
	$log.log(new Date()+" - Entrei no PollItemController");
	$scope.poll = Poll.get({pollId: $routeParams.pollId});
	socket.on('myvote', function(data) {
		console.dir(data);
		if(data._id === $routeParams.pollId) {
			$scope.poll = data;
		}
	});
	
	socket.on('vote', function(data) {
		console.dir(data);
		if(data._id === $routeParams.pollId) {
			$scope.poll.choices = data.choices;
			$scope.poll.totalVotes = data.totalVotes;
		}		
	});
	
	$scope.timeInMs;
    $scope.timeInSec;
    var cronometro;
    
    var finall = (new Date()).getTime()+20*1000;
    var agora;        
    var contador;
    var _segundos = 1000;
    var _minuto = _segundos * 60;

	
	var pararContador = function(cronometro){
		$timeout.cancel(cronometro);	    
	}
	
	
	$scope.vote = function(resposta) {
		var pollId = $scope.poll._id,
				choiceId = resposta._id,
				correctId = resposta.correct;
			
		if(choiceId) {
			var voteObj = { poll_id: pollId, choice: choiceId, correctId: correctId };
			socket.emit('send:vote', voteObj);
			pararContador(cronometro);
		} else {
			alert('You must select an option to vote for');
		}
	};
	
    var contadoRegressivo = function() {
        agora = new Date();
        contador = finall - agora;
        
        $scope.timeInSec = Math.floor( (contador) / _segundos );
	    $scope.timeInMs = contador % _segundos;
        cronometro = $timeout(contadoRegressivo, 50);
        if( contador <= 0 ){
        	$log.log(new Date()+" - Enviou o voto");
            $scope.vote($scope.poll.choices[4]);
            $scope.timeInMs = 0.0;
            $scope.timeInSec = 0.0;
        };
    };
    $timeout(function(){
    	$scope.poll.userVoted;
    	if( !($scope.poll.userVoted)){
    		$timeout(contadoRegressivo);
        }
    });
    $scope.doShuffle = function(){
    	shuffleArray($scope.poll.choices);
    };
    $rootScope.$on(
            "$routeChangeSuccess",
            function( $currentRoute, $previousRoute ){
                // Stop Counting.
                pararContador(cronometro);
            }
        );
}

// Controller for creating a new poll
function PollNewCtrl($scope, $location, Poll, $log) {
	$log.log(new Date()+" - Entrei no PollNewController");
	// Define an empty poll model object
	$scope.poll = {
		question: '',
		choices: [ { text: '', correct: true }, { text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }]
	};
	$scope.setChoiceForQuestion = function (q, c) {
        angular.forEach(q.choices, function (c) {
            c.correct = false;
        });
        
        c.correct = true;
    };
	/*// Method to add an additional choice option
	$scope.addChoice = function() {
		$scope.poll.choices.push({ text: '' });
	};
	*/
	// Validate and save the new poll to the database
	$scope.createPoll = function() {
		$log.log(new Date()+" - Entrei no CreatePoll");
		var poll = $scope.poll;
		
		// Check that a question was provided
		if(poll.question.length > 0) {
			var choiceCount = 0;
			
			// Loop through the choices, make sure at least two provided
			for(var i = 0, ln = poll.choices.length; i < ln; i++) {
				var choice = poll.choices[i];
				
				if(choice.text.length > 0) {
					choiceCount++
				}
			}
		
			if(choiceCount == 4 ) {
				poll.choices.push({ text: 'Sem resposta', correct: false });
				// Create a new poll from the model
				var newPoll = new Poll(poll);
				
				// Call API to save poll to the database
				newPoll.$save(function(p, resp) {
					$log.log(new Date()+" - Entrei no CreatePoll SAVE()");
					if(!p.error) {
						// If there is no error, redirect to the main view
						$location.path('polls');
					} else {
						alert('Nao foi possivel cadastrar o conteudo');
					}
				});
			} else {
				alert('Voce deve preencher todos os campos de respostas');
			}
		} else {
			alert('Voce deve preencher o nome da questao');
		}
	};
}

  // -> Fisherï¿½Yates shuffle algorithm
  var shuffleArray = function(array) {
    var m = array.length-1, t, i;
  
    // While there remain elements to shuffle
    while (m) {
      // Pick a remaining elementï¿½
      i = Math.floor(Math.random() * m--);
  
      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
  
    return array;
  }
  
//Find player by ID
var playerById = function(id, players) {
  	var i;
  	for (i = 0; i < players.length; i++) {
  		if (players[i].id == id){
  			return players[i];
  		}
  	};  	
  	return false;
  };
  
//Quando o usuÃ¡rio inicia um drag, guardamos no dataset do evento
//o id do objeto sendo arrastado e do objeto que o guarda
function dragStart(ev) {
	ev.dataTransfer.setData("draggedElementID"		, ev.target.getAttribute('id'));
}

//Quando o usuÃ¡rio arrasta sobre um dos painÃ©is, retornamos
//false para que o evento nÃ£o se propague para o navegador, o
//que faria com que o conteÃºdo fosse selecionado.
function dragOver(ev) {
	return false;
}

//Quando soltamos o elemento sobre um painel, movemos o
//elemento, lendo seu id do dataset do evento
function dragDrop(ev) {
	console.dir(ev.target)
	var draggedElementID = ev.dataTransfer.getData("draggedElementID");
	var swippedElementID;
	if( ev.target.nodeName === "DIV" ){
		var swippedElement = ev.target.firstElementChild.firstElementChild;
		swippedElementID   = ev.target.firstElementChild.getAttribute('id');
		ev.target.firstElementChild.appendChild(document.getElementById(draggedElementID).firstElementChild);
		document.getElementById(draggedElementID).appendChild(swippedElement);
	}else{
		var swippedElement = ev.target;
		swippedElementID   = ev.target.parentNode.getAttribute('id');
		ev.target.parentNode.appendChild(document.getElementById(draggedElementID).firstElementChild);
		document.getElementById(draggedElementID).appendChild(swippedElement);
	}
	var aux = selectedQuestions[draggedElementID];
	selectedQuestions[draggedElementID] = selectedQuestions[swippedElementID];
	selectedQuestions[swippedElementID] = aux;
	
	console.dir(selectedQuestions)
}