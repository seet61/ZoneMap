var express = require('express');
var router = express.Router();
var debug = require('debug')('zonemap:server');


// Authentication and Authorization Middleware
var auth = function(req, res, next) {
	if (req.session)
		return next();
	else
		res.redirect('/login');
};


router.get('/login', function(req, res, next) {
	console.log('/login get');
	var view = {
		"template_login": true
	};
	res.render('layout.html', view);
});


router.post('/login', function(req, res, next) {
	console.log('/login post: ' + req.session);
	console.log('/login post: ' + req.query);
	if (!req.query.username || !req.query.password) {
		//Отпарвить ошибку ввода логина пароля
		console.log('/login get');
		var view = {
			"template_login": true,
			"error_block": true,
			"error_text":"Не правильный логин или пароль!"
		};
		res.render('layout.html', view);
	} else {
		//req.session.user = "amy";
		//req.session.admin = true;
		//логика авторизации
		//req.query.username === "amy" || req.query.password === "amyspassword"
		req.session.authenticated = true;
		res.redirect('/');
	}
});

// Logout endpoint
router.get('/logout', function(req, res) {
	req.session.destroy();
	res.redirect('/login');
});

/* GET home page. */
router.get('/', auth, function(req, res, next) {
	console.log('/ get: ' + req.session.authenticated);
	var view = {
		"template_index": true,
	};
	res.render('layout.html', view);
});

module.exports = router;