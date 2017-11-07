var express = require('express');
var router = express.Router();
var debug = require('debug')('zonemap:index');
var ldap = require('ldapjs');
var db = require('../modules/db');
var config  = require('config');


// Authentication and Authorization Middleware
var auth = function(req, res, next) {
	if (req.session.authenticated === true)
		return next();
	else
		res.redirect('/login');
};

// GET home page
router.get('/', auth, function(req, res, next) {
	debug('/ get: ' + req.session);
	var view = {
		"template_index": true,
	};
	res.render('layout.html', view);
});

//Get Login page
router.get('/login', function(req, res, next) {
	debug('/login get');
	var view = {
		"template_login": true
	};
	res.render('layout.html', view);
});

//Post login
router.post('/login', function(req, res, next) {
	if (!req.body.login || !req.body.password) {
		//Отпарвить ошибку ввода логина пароля
		debug('/login get');
		var view = {
			"template_login": true,
			"error_block": true,
			"error_text": "Не правильный логин или пароль!"
		};
		res.render('layout.html', view);
	} else {
		//логика авторизации
		debug('/login login ' + req.body.login + ' pass ' + req.body.password);
		var url = 'ldap://ldap.corp.tele2.ru';

		var userPrincipalName = req.body.login + '@corp.tele2.ru';
		var passwd = req.body.password;

		// Bind as the user
		/*var adClient = ldap.createClient({
			url: url
		});
		adClient.bind(userPrincipalName, passwd, function(err) {
	        if (err != null) {
	            if (err.name === "InvalidCredentialsError") { 
	            	//res.send("Credential error");
	            	var view = {
						"template_login": true,
						"error_block": true,
						"error_text": "Ошибка авторизации. Проверьте логин и пароль!"
					};
					res.render('layout.html', view);
	            } else {
	            	var view = {
						"template_login": true,
						"error_block": true,
						"error_text":"Неизвестная ошибка: " + JSON.stringify(err)
					};
					res.render('layout.html', view);
	            }
	        } else {
	        	req.session.authenticated = true;
				res.redirect('/');
	        }});*/

		 //dev
		req.session.authenticated = true;
		res.redirect('/');
		
	}
});

// Logout endpoint
router.get('/logout', function(req, res) {
	debug('/logout');
	req.session.destroy();
	res.redirect('/login');
});

// GET page with table of version platform
router.get('/table_version_platform', auth, function(req, res, next) {
	debug('/table_version_platform get' );
	debug('db connect_string: ' + config.get('ZoneMap.dbConfig.connectionString'));
	db.get_versions(config.get('ZoneMap.dbConfig.connectionString'), function(versions){
		//var versions_string = typeof versions === 'string';
      	debug('versions: ' + versions);
      	var view = {
        	"template_table_version_platform": true,
        	"versions": versions
      	};
      	res.render('layout.html', view);
    });
});

// GET graph page
router.get('/graph', auth, function(req, res, next) {
	debug('/graph get: ' + req.session);
	db.get_init_servers(config.get('ZoneMap.dbConfig.connectionString'), function(init_servers){
		debug('init_servers: ' + init_servers);
		var view = {
			"template_graph": true,
			"init_servers": init_servers
		};
		res.render('layout.html', view);
	});
});

module.exports = router;