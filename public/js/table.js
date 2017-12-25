var treeData = {};
var progress = 10;
var step = 10;
var $table = $('#table');

function enable_loading() {
  $('#progress_bar').attr('hidden', false);
  $('#bar').attr('style', "width: 1%;");
  $('#bar').attr('aria-valuenow', "1");
  $('#bar').text("1%");
}

function disable_loading() {
  $('#progress_bar').attr('hidden', "hidden");
  $('#bar').attr('style', "width: 0%;");
  $('#bar').attr('aria-valuenow', "0");
}

function set_progress() {
  if (progress > 100) {
    progress = 100;
  }
  $('#bar').attr('style', "width: " + Math.round(progress) + "%;");
  $('#bar').attr('aria-valuenow', Math.round(progress));
  $('#bar').text(Math.round(progress) + "%");
}

function get_service_history(host, data_port, http_port, service_port) {
  progress = 10;
  step = 0;

  enable_loading();
  $.ajax({
    dataType: "json",
    url: "/get_service_history",
    data: {
      host_ip: host,
      data_port: data_port, 
      http_port: http_port, 
      service_port: service_port
    },
    success: onGetDataSuccess,
    error: onError
  });
 
}

function onError(error_text) {
  ////console.log('Ошибка получения информации!');
  $('#alert_message').text(error_text);
  $('#alert').attr('hidden', false);
  setTimeout(function() { 
    $('#alert_message').alert('close');
    disable_loading();
  }, 1000);
}


function onGetDataSuccess(data) {
  // Здесь мы получаем данные, отправленные сервером и выводим их на экран.
  set_progress();
  var infoData = JSON.parse(data);
  //console.log('infoData: ' + infoData["history"]);
  $table.bootstrapTable('load', infoData["history"]);
  disable_loading();
}

//Обработка нажатия строки на таблице V3
$('#get_history_modal').on('show.bs.modal', function (event) {
  var tr = $(event.relatedTarget) // Button that triggered the modal
  var recipient = tr.data('whatever') // Extract info from data-* attributes
  recipient = recipient.split(';');
  var host = recipient[0];
  var service = recipient[1];
  var data_port = recipient[2];
  var http_port = recipient[3];
  var service_port = recipient[4];
  ////console.log(recipient.split(';'));
  var modal = $(this);
  modal.find('.modal-title').text(host + " " + service);
  
  $table.bootstrapTable('removeAll');
  //Загрузка информации в виде таблицы
  get_service_history(host, data_port, http_port, service_port)
})

function get_database_history(tns_sid, tns_name) {
  progress = 10;
  step = 0;

  enable_loading();
  $.ajax({
    dataType: "json",
    url: "/get_database_history",
    data: {
      tns_sid: tns_sid,
      tns_name: tns_name
    },
    success: onGetDataSuccess,
    error: onError
  });
 
}

//Обработка нажатия строки на таблице V3
$('#get_history_about').on('show.bs.modal', function (event) {
  var tr = $(event.relatedTarget) // Button that triggered the modal
  var recipient = tr.data('whatever') // Extract info from data-* attributes
  var tns_sid = recipient.split(';')[0];
  var tns_name = recipient.split(';')[1];
  ////console.log(recipient.split(';'));
  var modal = $(this);
  modal.find('.modal-title').text(tns_sid);
  
  $table.bootstrapTable('removeAll');
  //Загрузка информации в виде таблицы
  get_database_history(tns_sid, tns_name)
})