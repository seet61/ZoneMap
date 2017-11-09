var pg = require('pg');
var debug = require('debug')('zonemap:db');



function get_versions(connect_string, versions) {
  /* Получение информации для таблицы версий */
  pg.connect(connect_string, function(err, client, done) {
    if(err) {
      debug('error fetching client from pool');
      return console.error('error fetching client from pool', err);
    }
    client.query('select host_ip, service_name, service_type, service_version, data_port, http_port, service_port, system_name, system_version, data_base from public.init_servers ins, public.server_services sss where ins.serv_id = sss.serv_id and sss.end_date>current_date', function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        debug('error running query');
        return console.error('error running query', err);
      }
      //console.log(result.rows);
      versions(result.rows);
    });
  });
}

function get_init_servers(connect_string, init_servers) {
  /* Получение списка серверов для выбора в выподающем списке карты */
  pg.connect(connect_string, function(err, client, done) {
    if(err) {
      debug('error fetching client from pool');
      return console.error('error fetching client from pool', err);
    }
    client.query('SELECT serv_id, host_ip FROM public.init_servers', function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        debug('error running query');
        return console.error('error running query', err);
      }
      //console.log(result.rows);
      init_servers(result.rows);
    });
  }); 
}

function get_list_services(connect_string, serv_id, host_ip, list_services) {
  /* Получаем список сервисов на выбранном хосте */
  pg.connect(connect_string, function(err, client, done) {
    if(err) {
      debug('error fetching client from pool');
      return console.error('error fetching client from pool', err);
    }
    var select_services = 'SELECT * FROM server_services where serv_id = $1 and end_date>current_date;';
    var select_services_vars = [serv_id];
    client.query(select_services, select_services_vars, function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        debug('error running query');
        return console.error('error running query', err);
      }
      //debug('get_list_services: ' + result.rows[0]['service_name']);
      var children_services = [];
      //debug('get_list_services: ' + result.rows.length);
      for (var i = 0; i < result.rows.length; i++) {
        children_services.push({"name" : result.rows[i]['service_name']});
      }
      debug('children_services: ' + children_services[0]["name"]);
      var json_string = JSON.stringify({"name" : host_ip, "children" : children_services});
      debug('json_string: ' + json_string);
      list_services(json_string);
      //list_services={};
    });
  }); 
}

function get_about(connect_string, serv_id, service_name, about_service) {
  /* Получаем информацию о сервисе */
  pg.connect(connect_string, function(err, client, done) {
    if(err) {
      debug('error fetching client from pool');
      return console.error('error fetching client from pool', err);
    }
    var select_services = 'SELECT * FROM server_services where serv_id = $1 and service_name = $2 and end_date>current_date;';
    var select_services_vars = [serv_id, service_name];
    client.query(select_services, select_services_vars, function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        debug('error running query');
        return console.error('error running query', err);
      }
      var about_array = [];
      about_array.push({"name" : 'service type', "children" : [{"name": result.rows[0]['service_type']}]});
      about_array.push({"name" : 'service version', "children" : [{"name": result.rows[0]['service_version']}]});
      about_array.push({"name" : 'data port', "children" : [{"name": result.rows[0]['data_port']}]});
      about_array.push({"name" : 'http port', "children" : [{"name": result.rows[0]['http_port']}]});
      about_array.push({"name" : 'service port', "children" : [{"name": result.rows[0]['service_port']}]});
      about_array.push({"name" : 'system name', "children" : [{"name": result.rows[0]['system_name']}]});
      about_array.push({"name" : 'system version', "children" : [{"name": result.rows[0]['system_version']}]});
      about_array.push({"name" : 'database', "children" : [{"name": result.rows[0]['data_base']}]});
      debug('about_array: ' + about_array);
      about_service(about_array);
    });
  }); 
}

function get_service_id(connect_string, serv_id, service_name, service_id) {
  /* Получаем информацию о сервисе */
  pg.connect(connect_string, function(err, client, done) {
    if(err) {
      debug('error fetching client from pool');
      return console.error('error fetching client from pool', err);
    }
    var select_services = 'SELECT service_id FROM server_services where serv_id = $1 and service_name = $2 and end_date>current_date;';
    var select_services_vars = [serv_id, service_name];
    client.query(select_services, select_services_vars, function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        debug('error running query');
        return console.error('error running query', err);
      }

      service_id(result.rows[0]['service_id']);
    });
  }); 
}


function get_aa(connect_string, serv_id, service_id, list_aa) {
  /* Получаем список групп АА */
  pg.connect(connect_string, function(err, client, done) {
    if(err) {
      debug('error fetching client from pool');
      return console.error('error fetching client from pool', err);
    }
    var select_aa = 'SELECT * FROM sg_aa where serv_id = $1 and service_id = $2 and end_date>current_date;';
    var select_services_vars = [serv_id, service_id];
    client.query(select_aa, select_services_vars, function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        debug('error running query');
        return console.error('error running query', err);
      }
      var system_array = []; 
      for (var i=0; i < result.rows.length; i++) {
        system_array.push({"name" : result.rows[i]['system_name']});
      }
      list_aa(system_array);
    });
  }); 
}

function get_artifacts(connect_string, serv_id, service_id, list_artifacts) {
  /* Получаем информацию о сервисе */
  pg.connect(connect_string, function(err, client, done) {
    if(err) {
      debug('error fetching client from pool');
      return console.error('error fetching client from pool', err);
    }
    var select_artifacts = 'SELECT * FROM service_artifacts where serv_id = $1 and service_id = $2 and end_date>current_date;';
    var select_services_vars = [serv_id, service_id];
    client.query(select_artifacts, select_services_vars, function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        debug('error running query');
        return console.error('error running query', err);
      }
      var artifacts_array = []; 
      for (var i=0; i < result.rows.length; i++) {
        artifacts_array.push({"name" : result.rows[i]['artifact_name'], 
          "children" : [
            { "name" : result.rows[i]['artifact_type']},
            { "name" : result.rows[i]['artifact_version']}
            ]});
      }
      list_artifacts(artifacts_array);
    });
  }); 
}

function get_routing(connect_string, serv_id, service_id, list_routes) {
  /* Получаем роуты по сервису */
  var distinct_routes = []; 
  var routing_array = [];

  pg.connect(connect_string, function(err, client, done) { 
    if(err) {
      debug('error fetching client from pool');
      return console.error('error fetching client from pool', err);
    }
    var select_routes = 'select distinct(port_type) as port_type from service_routes where serv_id = $1 and service_id = $2 and end_date>current_date;';
    var select_services_vars = [serv_id, service_id];

    
    client.query(select_routes, select_services_vars, function(err, result) { 
      done();

      if(err) {
        debug('error running query');
        return console.error('error running query', err);
      }

      for (var k=0; k < result.rows.length; k++) {
        distinct_routes.push(result.rows[k]['port_type'])
      }
      //debug('distinct_routes: ' + distinct_routes);
      for (var i=0; i < distinct_routes.length; i++) { 
        //debug('distinct_routes: ' + distinct_routes[i]);
        pg.connect(connect_string, function(err, client1, done1) { 
          debug('distinct_route: ' + distinct_routes[i]);
          if(err) {
            debug('error fetching client from pool');
            return console.error('error fetching client from pool', err);
          }
          var select_routes = 'select * from service_routes where serv_id = $1 and service_id = $2 and end_date>current_date and port_type= $3;';
          var select_select_route = [serv_id, service_id, distinct_routes[i]];


          client1.query(select_routes, select_select_route, function(err, result_route) { 
            done1();

            if(err) {
              debug('error running query');
              return console.error('error running query', err);
            }

            var rout_children = [];
            for (var j=0; j < result_route.rows.length; j++) { 
              rout_children.push({"name" : result_route.rows[j]['condition'], "children" : [{"name" : result_route.rows[j]['rule']}, {"name" : result_route.rows[j]['external_name']}]});
            }
            debug('rout_children: ' + rout_children);
            routing_array.push({"name" : distinct_routes[i], "children" : rout_children}); 
            debug(distinct_routes[i] + ' routing_array: ' + routing_array);
          });
        });
      }
    });
    debug('routing_array: ' + routing_array);
    list_routes(routing_array);
  });  
  
/*

  


      
      pg.connect(connect_string, function(err, client1, done) { 
        if(err) {
          debug('error fetching client from pool');
          return console.error('error fetching client from pool', err);
        }
        var select_routes = 'select distinct(port_type) as port_type from service_routes where serv_id = $1 and service_id = $2 and end_date>current_date;';
        var select_services_vars = [serv_id, service_id];
        client1.query(select_routes, select_services_vars, function(err, result1) {
          done();

          if(err) {
            debug('error running query');
            return console.error('error running query', err);
          }

          for (var i=0; i < result.rows.length; i++) {
            debug('port_type: ' + result.rows[i]['port_type']);
            //Получили уникальные port_type теперь выбираем их сгруппированные
            var select_route = 'select * from service_routes where serv_id = $1 and service_id = $2 and end_date>current_date and port_type= $3;';
            var select_select_route = [serv_id, service_id, result.rows[i]['port_type']];
            client.query(select_routes, select_services_vars, function(err, result_route) { 
              if(err) {
                debug('error running query');
                return console.error('error running query', err);
              }

              //var route_groups = {}; 
              var rout_children = [];
              for (var j =0; j < result_route.rows.length; j++) { 
                rout_children.push({"name" : result_route.rows[j]['condition'], "children" : [{"name" : result_route.rows[j]['rule']}, {"name" : result_route.rows[j]['external_name']}]});
              }
              artifacts_array.push({"name" : result.rows[i]['port_type'], "children" : rout_children});
            });
          }
        });

      
    });
  });*/
}


//Shutdown connect
pg.end();

//https://stackoverflow.com/questions/33589571/module-exports-that-include-all-functions-in-a-single-line
module.exports = {
  get_versions : get_versions,
  get_init_servers : get_init_servers,
  get_list_services : get_list_services, 
  get_about : get_about, 
  get_service_id : get_service_id,
  get_aa : get_aa,
  get_artifacts : get_artifacts,
  get_routing : get_routing
}