var express = require('express');
var router = express.Router();
var debug = require('debug')('zonemap:index');
var ldap = require('ldapjs');
var db = require('../modules/db');
var config  = require('config');

var distinct = [];

// Authentication and Authorization Middleware
var auth = function(req, res, next) {
	if (req.session.authenticated === true) {
		debug('req: ' + JSON.stringify(req.session));
		return next();
	} else
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
		var adClient = ldap.createClient({
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
	        }});
		
		 //dev
		/*req.session.authenticated = true;
		res.redirect('/');*/
		
	}
});

// Logout endpoint
router.get('/logout', function(req, res) {
	debug('/logout');
	req.session.destroy();
	res.redirect('/login');
});

// GET page with table of version platform
router.get('/table_versions', auth, function(req, res, next) {
	debug('/table_versions get' );
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

// GET page with table of version db about
router.get('/table_db_about', auth, function(req, res, next) {
	debug('/table_db_about get' );
	debug('db connect_string: ' + config.get('ZoneMap.dbConfig.connectionString'));
	db.get_db_about(config.get('ZoneMap.dbConfig.connectionString'), function(db_about){
		//var versions_string = typeof versions === 'string';
      	debug('db_about: ' + db_about);
      	var view = {
        	"template_table_db_about": true,
        	"db_about": db_about
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

// Получение списка сервисов на сервере
router.get('/platform_services', auth, function(req, res, next) {
	debug('/platform_services get: ' + req.query.serv_id);
	db.get_list_services(config.get('ZoneMap.dbConfig.connectionString'), req.query.serv_id, req.query.host_ip, function(list_services){
		res.status(200).json(list_services);
	});
});

// Получение информации о сервисе и главной конфигурации
router.get('/service_about', auth, function(req, res, next) {
	debug('/service_about get: ' + req.query.serv_id + " " + req.query.service_name);
	db.get_about(config.get('ZoneMap.dbConfig.connectionString'), req.query.serv_id, req.query.service_name, function(about_service){
		res.status(200).json(JSON.stringify({"name":"About", "children" : about_service}));
	});
});

// Получение групп АА для SG
router.get('/service_aa', auth, function(req, res, next) {
	debug('/service_aa get: ' + req.query.serv_id + " " + req.query.service_name);
	var infoArray = [];
	db.get_service_id(config.get('ZoneMap.dbConfig.connectionString'), req.query.serv_id, req.query.service_name, function(service_id){
		db.get_aa(config.get('ZoneMap.dbConfig.connectionString'), req.query.serv_id, service_id, function(list_aa){
			res.status(200).json(JSON.stringify({"name":"AA Groups", "children" : list_aa}));
		});
	});
});

// Получение списка артифактов для LWSA & SLES
router.get('/service_artifacts', auth, function(req, res, next) {
	debug('/service_artifacts get: ' + req.query.serv_id + " " + req.query.service_name);
	var infoArray = [];
	db.get_service_id(config.get('ZoneMap.dbConfig.connectionString'), req.query.serv_id, req.query.service_name, function(service_id){
		db.get_artifacts(config.get('ZoneMap.dbConfig.connectionString'), req.query.serv_id, service_id, function(list_artifacts){
			res.status(200).json(JSON.stringify({"name":"Artifacts", "children" : list_artifacts}));
		});
	});
});


// Получение списка роутов
router.get('/service_routing', auth, function(req, res, next) {
	debug('/service_routing get: ' + req.query.serv_id + " " + req.query.service_name);
	var list_routes = [];
	db.get_service_id(config.get('ZoneMap.dbConfig.connectionString'), req.query.serv_id, req.query.service_name, function(service_id){
		db.get_distinct_routs(config.get('ZoneMap.dbConfig.connectionString'), req.query.serv_id, service_id, function(distinct_routs){
			//debug("get_distinct_routs distinct_routs: " + distinct_routs);
			for (var i = 0; i < distinct_routs.length; i++) {
				//debug("get_distinct_routs distinct_rout: " +  distinct_routs[i]);
				//distinct = [];
				//
				db.get_distinct_groups(config.get('ZoneMap.dbConfig.connectionString'), req.query.serv_id, service_id, distinct_routs[i], function(distinct_groups) {
					//debug('get_distinct_groups distinct_groups:' + distinct_groups);
					clear_distinct();
					//set_distinct_groups(distinct_groups);
				});

				debug('distinct: ' + JSON.stringify(distinct));
				list_routes.push({"name" : distinct_routs[i], "children" : get_distinct_groups()});
			}
			res.status(200).json(JSON.stringify({"name":"Routes", "children" : list_routes}));
		});
	});
});

// Получение списка внешних соединений
router.get('/service_externals', auth, function(req, res, next) {
	debug('/service_externals get: ' + req.query.serv_id + " " + req.query.service_name);
	var infoArray = [];
	db.get_service_id(config.get('ZoneMap.dbConfig.connectionString'), req.query.serv_id, req.query.service_name, function(service_id){
		db.get_externals(config.get('ZoneMap.dbConfig.connectionString'), req.query.serv_id, service_id, function(list_externals){
			res.status(200).json(JSON.stringify({"name":"External connections", "children" : list_externals}));
		});
	});
});


module.exports = router;