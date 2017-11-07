var pg = require('pg');
var debug = require('debug')('zonemap:db');

function get_versions(connect_string, versions) {
  pg.connect(connect_string, function(err, client, done) {
    if(err) {
      debug('error fetching client from pool');
      return console.error('error fetching client from pool', err);
    }
    client.query('select host_ip, service_name, service_type, service_version, data_port, http_port, service_port, system_name, system_version from public.init_servers ins, public.server_services sss where ins.serv_id = sss.serv_id', function(err, result) {
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
  pg.connect(connect_string, function(err, client, done) {
    if(err) {
      debug('error fetching client from pool');
      return console.error('error fetching client from pool', err);
    }
    var select_services = 'SELECT * FROM server_services where serv_id = $1;';
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

//Shutdown connect
pg.end();

exports.get_versions = get_versions;
exports.get_init_servers = get_init_servers;
exports.get_list_services = get_list_services;