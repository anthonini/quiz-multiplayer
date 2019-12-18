var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
	nome : {
		type : String,
		default: ''
	},
	tipo: {
		type: String,
		default: 'Admin'
	},
	email: {
		type: String,
		default: ''
	},
	disciplines: []
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Accounts', Account);
