// Angular service module for connecting to JSON APIs
angular.module('pollServices', ['ngResource']).
	factory('Poll', function($resource, $log) {
		$log.log(new Date()+" - Entrei no Poll factory");
		return $resource('polls/:pollId', {}, {
			// Use this method for getting a list of polls
			query: { method: 'GET', params: { pollId: 'polls'}, isArray: true }
		})
	}).
	factory('Account', function($resource, $log) {
		$log.log(new Date()+" - Entrei no Account factory");	
		return $resource('accounts/:accountId', {}, {
			// Use this method for getting a list of polls
			query: { method: 'GET', params: { accountId: 'Accounts'}, isArray: true }
		})
			
	}).
	factory('Professor', function($resource, $log) {
		$log.log(new Date()+" - Entrei no Professor factory");
		return $resource('/professor/professor', {}, {
			query: { method: 'GET', params: {}, isArray: true }
		})
	}).
	factory('Jogador', function($resource, $log) {
		$log.log(new Date()+" - Entrei no Jogador factory");
		return $resource('/jogador/jogador', {}, {
			query: { method: 'GET', params: {accountId: 'jogador'}, isArray: true }
		})
	}).
	factory('ProfessorDisciplines', function($resource, $log) {
		$log.log(new Date()+" - Entrei no ProfessorDisciplines factory");
		return $resource('/professor/disciplines', {}, {
			query: { method: 'GET', params: {}, isArray: true }
		})
	}).
	factory('Discipline', function($resource, $log) {
		$log.log(new Date()+" - Entrei no Discipline factory");	
		return $resource('disciplines/:disciplineId', {}, {
			// Use this method for getting a list of polls
			query: { method: 'GET', params: { disciplineId: 'disciplines'}, isArray: true }
		})
	}).
	factory('DisciplineSubjects', function($resource, $log) {
		$log.log(new Date()+" - Entrei no Discipline Subjects factory");
		return $resource('/discipline/subjects/:disciplineId', {}, {
			// Use this method for getting a list of questions
			query: { method: 'GET', params: {disciplineId: 'subjects'}, isArray: true }
		})
	}).
	factory('Subject', function($resource, $log) {
		$log.log(new Date()+" - Entrei no Subject factory");
		return $resource('subjects/:subjectId', {}, {
			// Use this method for getting a list of questions
			query: { method: 'GET', params: { subjectId: 'subject'}, isArray: true }
		})
	}).
	factory('SubjectQuestions', function($resource, $log) {
		$log.log(new Date()+" - Entrei no Subject Questions factory");
		return $resource('subjects/questions/:subjectId', {}, {
			// Use this method for getting a list of questions
			query: { method: 'GET', params: {subjectId: 'subjects'}, isArray: true }
		})
	}).
	factory('Question', function($resource, $log) {
		$log.log(new Date()+" - Entrei no Question factory");
		return $resource('questions/:questionId/', {}, {
			// Use this method for getting a list of questions
			query: { method: 'GET', params: { questionId: 'question'}, isArray: true }
		})
	}).
	factory('Quiz', function($resource, $log) {
		$log.log(new Date()+" - Entrei no Quiz factory");	
		return $resource('quiz/:quizId', {}, {
			// Use this method for getting a list of polls
			query: { method: 'GET', params: { quizId: 'quiz'}, isArray: true }
		})
	}).
	factory('socket', function($rootScope) {
		var socket = io.connect();
		return {
			on: function (eventName, callback) {
	      socket.on(eventName, function () {
	        var args = arguments;
	        $rootScope.$apply(function () {
	          callback.apply(socket, args);
	        });
	      });
	    },
	    emit: function (eventName, data, callback) {
	      socket.emit(eventName, data, function () {
	        var args = arguments;
	        $rootScope.$apply(function () {
	          if (callback) {
	            callback.apply(socket, args);
	          }
	        });
	      })
	    }
		};
	});