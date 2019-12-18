// Angular module, defining routes for the app
angular.module('polls', ['pollServices']).
	config(['$routeProvider', function($routeProvider) {
		$routeProvider.
			when('/poll/:pollId', 					{ templateUrl: 'partials/quizQuestion.html',controller: PollItemCtrl, 		action: 'quiz'}).
			when('/polls', 							{ templateUrl: 'partials/list.html', 		controller: PollListCtrl, 		action: 'user'}).
			when('/new', 							{ templateUrl: 'partials/new.html', 		controller: PollNewCtrl, 		action: 'user'}).
			when('/accounts', 						{ templateUrl: 'partials/accounts.html', 	controller: AccountListCtrl,	action: 'user'}).
			when('/accounts/:accountId',			{ templateUrl: 'partials/account.html', 	controller: AccountItemCtrl,	action: 'user'}).
			when('/disciplines', 					{ templateUrl: 'partials/disciplines.html', controller: DisciplineListCtrl, action: 'user', path: 'disciplines'}).
			when('/newDiscipline', 					{ templateUrl: 'partials/discipline.html', 	controller: DisciplineCtrl, 	action: 'user', path: 'newDiscipline'}).
			when('/updateDiscipline/:disciplineId',	{ templateUrl: 'partials/discipline.html', 	controller: DisciplineCtrl,		action: 'user', path: 'updateDiscipline'}).
			when('/contentRegister', 				{ templateUrl: 'partials/disciplines.html', controller: DisciplineListCtrl, action: 'user', path: 'contentRegister'}).
			when('/subject/:subjectId',		 		{ templateUrl: 'partials/questions.html', 	controller: SubjectItemCtrl, 	action: 'user'}).
			when('/newQuestion/:subjectId', 		{ templateUrl: 'partials/question.html', 	controller: QuestionItemCtrl, 	action: 'user', path: 'newQuestion'}).
			when('/question/:subjectId/:questionId',{ templateUrl: 'partials/question.html', 	controller: QuestionItemCtrl, 	action: 'user', path: 'question'}).
			when('/createQuiz',						{ templateUrl: 'partials/quizCreate.html', 	controller: QuizNewCtrl,		action: 'user'}).
			when('/quizzes',						{ templateUrl: 'partials/quizzes.html', 	controller: QuizListCtrl,		action: 'user'}).
			when('/index',							{ templateUrl: 'partials/quizIndex.html', 	controller: QuizListCtrl,		action: 'user'}).
			when('/:quizId',						{ templateUrl: 'partials/quizGame.html', 	controller: QuizGameCtrl,		action: 'user'}).
			// If invalid route, just redirect to the main list view
			otherwise({ redirectTo: '' });
	}]).
	filter('orderObjectBy', function(){
		return function(items, field, reverse){
			var filtered = [];
			angular.forEach(items, function(item){
				filtered.push(item);
			});
			filtered.sort(function(a,b){
				return(a[field] > b[field]);
			});
			if(reverse){
				filtered.reverse();
			}
			return filtered;
		};
	});