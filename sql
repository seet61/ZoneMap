----lwsa 
select distinct host_ip, service_name, service_type, service_version, data_port, http_port, service_port, system_name, system_version, data_base, ld.tns_sid as data_base
  from init_servers ins, server_services sss 
  join lwsa_databases ld on ld.serv_id = sss.serv_id and ld.service_id = sss.service_id
 where ins.serv_id = sss.serv_id and sss.end_date>current_date order by 1,2
 
 select * from lwsa_databases ld
 
 select * from server_services where service_name = 'CMP_SLES_v3.2_selfcareDBV3'
 202,26
 
 
 
 select * from external_connections ec join lwsa_databases ld on ld.serv_id = ec.serv_id and ld.service_id = ec.service_id 
 where /*ec.serv_id = 26 and ec.service_id = 202 and*/  ec.external_name like '%LWSA%' and ec.end_date > current_date 
 select * from server_services
 
 select ec.*
   from server_services sss, external_connections ec
  where sss.service_name like '%SLES%'
   and ec.serv_id = sss.serv_id
   and ec.service_id = sss.service_id
   and ec.end_date > current_date
   and sss.end_date > current_date
      and sss.serv_id = 26 
   and sss.service_id = 202   
   and sss2.service_name=ec.external_name
   
   
   and ec2.end_date > current_date      
   and ec2.external_name like '%LWSA%'
   
   
   select * from init_servers where host_ip='10.78.245.36' --2
   select * from server_services where serv_id = 2
   
 select distinct(tns_sid) from lwsa_databases ld 
 where serv_id = 2

 select distinct(ld.tns_string), ld.tns_sid from lwsa_databases ld
 select * from lwsa_databases ld
 
 select * from databases_info where tns_sid = ? and tns_name = ? and end_date > current_date