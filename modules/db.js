var pg = require('pg');
var debug = require('debug');

function get_versions(connect_string, versions) {
  pg.connect(connect_string, function(err, client, done) {
    if(err) {
      debug('error fetching client from pool');
      return console.error('error fetching client from pool', err);
    }
    client.query('select host_ip, service_name, service_type, service_version, system_name, system_version from public.init_servers ins, public.server_services sss where ins.serv_id = sss.serv_id', function(err, result) {
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

pg.end();
exports.get_versions = get_versions;