var express = require('express');
var routes  = require('./routes');
var http    = require('http');
var path    = require('path');
var util    = require("util");
var flash   = require('connect-flash');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Account = require('./models/account');
var mongoose = require('mongoose');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

app.set('port', process.env.VCAP_APP_PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.session({ secret: 'securedsession' }));
app.use(passport.initialize()); // Add passport initialization
app.use(passport.session());    // Add passport initialization
app.use(flash());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.logger('dev'));
//app.use(express.compiler({ src: __dirname + '/public/css'}));


// Handle Errors gracefully
app.use(function(err, req, res, next) {
	if(!err){return next();}
	console.log(err.stack);
	res.json({error: true});
});

//Configure passport
var Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

mongoose.connect('mongodb://anthonini:anth12@cluster0-shard-00-00-nnapr.mongodb.net:27017,cluster0-shard-00-01-nnapr.mongodb.net:27017,cluster0-shard-00-02-nnapr.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority');

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	res.redirect("/login");
}

function ensureAdmin(req, res, next) {
	if (req.isAuthenticated()) {
		if (req.user.tipo==="Admin") { return next(); }
	}
	res.redirect("/");
}

function ensureProfessor(req, res, next) {
	if (req.isAuthenticated()) {
		if (req.user.tipo==="Admin" || req.user.tipo==="Professor") { return next(); }
	}
	res.redirect("/");
}

function ensureTeste(req, res) {
	window.location='/admin';
}

// Main App Page
//app.get('/', routes.index);

app.get('/', function (req, res) {
    res.render('index', { user : req.user, path : req.route.path,
               message: req.flash('success'), messages: req.flash('info') });
});

app.get('/admin', ensureAdmin, function (req, res) {
	res.render('template', { user : req.user, path : req.route.path});
});

app.get('/professor', ensureProfessor, function (req, res) {
	res.render('professor', { user : req.user, path : req.route.path});
});

app.get('/quiz', ensureAuthenticated, function (req, res) {
	res.render('quiz', { user : req.user, path : req.route.path });
	//console.dir(req);
});

app.get('/register', function(req, res) {
	res.render('sign-up', { user : req.user, message: req.flash('error'), path : req.route.path });
});

app.post('/register', function(req, res) {
    Account.register(new Account({ username : req.body.username, password : req.body.password, email : req.body.email }), req.body.password, function(err, account) {
        if (err) {
            return res.render( { account : account });
        }
        req.flash('info', 'Conta criada com sucesso!');
        res.redirect('/');
        res.render('', { account : account, path : req.route.path });
    });
});

app.get('/login', function(req, res) {
    res.render('sign-in', { user : req.user, message: req.flash('error'), path : req.route.path  });
});

app.post('/login',
		passport.authenticate('local',{successRedirect: '/',
			failureRedirect: '/login',
			successFlash: 'Login Efetuado com sucesso! Bem vindo',
			failureFlash: 'Usuario ou senha incorretos' })/*,
		function(req, res) {
            // successful auth, user is set at req.user.  redirect as necessary.
            if (req.user.tipo=="Admin") { return res.redirect('/teste#/accounts');}
            res.redirect('/welcome');
          }*/
    );

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

app.use(function(req, res, next){
	res.status(404);
      // respond with html page
      if (req.accepts('html')) {
        res.redirect('/');
        return;
      }

      // respond with json
      if (req.accepts('json')) {
         res.send({ error: 'Not found' });
         return;
      }

      // default to plain-text. send()
      res.type('txt').send('Not found');
});


// MongoDB API Routes
app.get('/polls/polls'		, routes.list	);
app.get('/polls/:id'		, routes.poll	);
app.post('/polls'			, routes.create	);
app.post('/vote'			, routes.vote	);

app.get('/jogador/jogador'				, routes.jogador	);

app.get('/accounts/accounts', ensureAdmin, routes.listAccounts);
app.get('/accounts/:id'		, routes.account);
app.post('/accounts'		, routes.saveAccount );

app.get('/professor/professor'		, routes.professor );
app.get('/professor/disciplines'	, routes.professorDisciplines );

app.get('/disciplines/disciplines'	, routes.listDisciplines);
app.get('/disciplines/:id'			, routes.discipline);
app.post('/disciplines'				, routes.createDiscipline);

app.get('/discipline/subjects/:id'	, routes.listSubjects	);
app.get('/subjects/:id'				, routes.subject		);
app.post('/subjects'				, routes.createSubject	);

app.get('/subjects/questions/:id'	, routes.listQuestions	);
app.get('/questions/:id'			, routes.question	);
app.post('/questions'				, routes.createQuestion	);

app.get('/quiz/quiz'				, routes.listQuiz	);
app.get('/quiz/:id'					, routes.quiz	);
app.post('/quiz'					, routes.createQuiz	);

io.sockets.on("connection", routes.vote);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var socket = io;
// Set up Socket.IO to listen on port 8000
//socket = io.listen(8000);

// Configure Socket.IO
socket.configure(function() {
	// Only use WebSockets
	socket.set("transports", ["websocket"]);

	// Restrict log output
	socket.set("log level", 2);
});
