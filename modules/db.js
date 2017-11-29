var pg = require('pg');
var debug = require('debug')('zonemap:db');

function get_versions(connect_string, versions) {
  /* Получение информации для таблицы версий */
  pg.connect(connect_string, function(err, client, done) {
    if(err) {
      debug('error fetching client from pool');
      return console.error('error fetching client from pool', err);
    }
    var versions_sql = 'select host_ip, service_name, service_type, service_version, data_port, http_port, service_port, system_name, system_version, data_base ' + 
                         'from init_servers ins, server_services sss ' +
                        'where ins.serv_id = sss.serv_id ' + 
                          'and sss.end_date>current_date ' + 
                        'order by 1,2';
    client.query(versions_sql, function(err, result) {
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
  pg.end();
}

function get_service_history(connect_string, host_ip, service_name, history) {
  /* Получение информации для таблицы версий */
  pg.connect(connect_string, function(err, client, done) {
    if(err) {
      debug('error fetching client from pool');
      return console.error('error fetching client from pool', err);
    }
    var history_sql = 'select service_type, service_version, data_port, http_port, service_port, system_name, system_version, data_base, to_char(start_date, \'DD-MM-YYYY HH24:MI:SS\') as start_date, to_char(end_date, \'DD-MM-YYYY HH24:MI:SS\') as end_date ' +
                         'from init_servers ins, server_services sss ' +
                        'where ins.serv_id = sss.serv_id ' + 
                          'and ins.host_ip = $1 ' +
                          'and sss.service_name = $2 ' +
                        'order by start_date'
    var history_sql_vars = [host_ip, service_name];
    client.query(history_sql, history_sql_vars, function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        debug('error running query');
        return console.error('error running query', err);
      }
      debug(result.rows[0]["start_date"]);
      history(result.rows);
    });
  });
  pg.end();
}

function get_db_about(connect_string, db_about) {
  /* Получение информации для таблицы о версиях в БД */
  pg.connect(connect_string, function(err, client, done) {
    if(err) {
      debug('error fetching client from pool');
      return console.error('error fetching client from pool', err);
    }
    var db_about_sql = 'SELECT tns_sid, tns_name, version_custom, version_invoice, version_invoice_date, instance_name, host_name fROM databases_info where end_date > current_date;';
    client.query(db_about_sql, function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        debug('error running query');
        return console.error('error running query', err);
      }
      //console.log(result.rows);
      db_about(result.rows);
    });
  });
  pg.end();
}

function get_init_servers(connect_string, init_servers) {
  /* Получение списка серверов для выбора в выподающем списке карты */
  pg.connect(connect_string, function(err, client, done) {
    if(err) {
      debug('error fetching client from pool');
      return console.error('error fetching client from pool', err);
    }
    //var init_sql = 'SELECT serv_id, host_ip FROM init_servers';
    var init_sql = 'select * from init_servers where host_ip not like \'%10.0.%\' and host_ip not like \'%10.251.%\' and host_ip not like \'%10.77.%\' order by 2';
    client.query(init_sql, function(err, result) {
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
  pg.end();
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
      debug('children_services: ' + children_services);
      var json_string = JSON.stringify({"name" : host_ip, "children" : children_services});
      debug('json_string: ' + json_string);
      list_services(json_string);
      //list_services={};
    });
  }); 
  pg.end();
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
  pg.end(); 
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
  pg.end();
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
  pg.end();
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
  pg.end();
}

function get_distinct_routs(connect_string, serv_id, service_id, distinct_routs) {
  /* Получаем роуты по сервису */
  var distinct = [];
  debug('serv_id: ' + serv_id + " service_id: " + service_id);

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

      debug("result.rows.length: " + result.rows.length);
      for (var k=0; k < result.rows.length; k++) {
        distinct.push(result.rows[k]['port_type']);
      }
      
      distinct_routs(distinct);
    });
  });
  pg.end();  
}


function get_distinct_groups(connect_string, serv_id, service_id, port_type, distinct_groups) {
  /* Получаем информацию о сервисе */
  debug('serv_id: ' + serv_id + " service_id: " + service_id + " port_type: " + port_type);
  pg.connect(connect_string, function(err, client, done) {
    if(err) {
      debug('error fetching client from pool');
      return console.error('error fetching client from pool', err);
    }
    var select_group = 'select * from service_routes where serv_id = $1 and service_id = $2 and end_date>current_date and port_type= $3;';
    var select_group_vars = [serv_id, service_id, port_type];
    client.query(select_group, select_group_vars, function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        debug('error running query');
        return console.error('error running query', err);
      }
      var group_array = []; 
      for (var i=0; i < result.rows.length; i++) {
        group_array.push({"name" : result.rows[i]['condition'], 
          "children" : [
            { "name" : result.rows[i]['rule']},
            { "name" : result.rows[i]['external_name']}
          ]});
      }  
      
      //debug('group_array: ' + group_array);
      distinct_groups(group_array);
    });
  });
  pg.end(); 
}

function get_externals(connect_string, serv_id, service_id, list_externals) {
  /* Получаем информацию о внешних соединениях */
  pg.connect(connect_string, function(err, client, done) {
    if(err) {
      debug('error fetching client from pool');
      return console.error('error fetching client from pool', err);
    }
    var select_externals = 'select distinct(external_name), data_address, service_address from external_connections where serv_id = $1 and service_id = $2 and end_date>current_date;';
    var select_externals_vars = [serv_id, service_id];
    client.query(select_externals, select_externals_vars, function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        debug('error running query');
        return console.error('error running query', err);
      }
      var externals_array = []; 
      for (var i=0; i < result.rows.length; i++) {
        externals_array.push({"name" : result.rows[i]['external_name'], 
          "children" : [
            { "name" : "data address", "children" : [{"name" : result.rows[i]['data_address']}]},
            { "name" : "service address", "children" : [{"name" : result.rows[i]['service_address']}]}
          ]});
      }
      
      list_externals(externals_array);
    });
  }); 
  pg.end();
}


//Shutdown connect
pg.end();

//https://stackoverflow.com/questions/33589571/module-exports-that-include-all-functions-in-a-single-line
module.exports = {
  get_versions : get_versions,
  get_service_history : get_service_history,
  get_db_about : get_db_about,
  get_init_servers : get_init_servers,
  get_list_services : get_list_services, 
  get_about : get_about, 
  get_service_id : get_service_id,
  get_aa : get_aa,
  get_artifacts : get_artifacts,
  get_distinct_routs : get_distinct_routs,
  get_distinct_groups : get_distinct_groups,
  get_externals : get_externals
}