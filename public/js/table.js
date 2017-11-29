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

function get_service_history(host, service) {
  progress = 10;
  step = 0;

  enable_loading();
  $.ajax({
    dataType: "json",
    url: "/get_service_history",
    data: {
      host_ip: host,
      service_name: service
    },
    success: onGetDataSuccess,
    error: onError
  });
 
}

function onError(error_text) {
  //console.log('Ошибка получения информации!');
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
  console.log('infoData: ' + infoData["history"]);
  $table.bootstrapTable('load', infoData["history"]);
  disable_loading();
}

//Обработка нажатия строки
$('#get_history_modal').on('show.bs.modal', function (event) {
  var tr = $(event.relatedTarget) // Button that triggered the modal
  var recipient = tr.data('whatever') // Extract info from data-* attributes
  var host = recipient.split(';')[0];
  var service = recipient.split(';')[1];
  //console.log(recipient.split(';'));
  var modal = $(this);
  modal.find('.modal-title').text(host + " " + service);
  
  $table.bootstrapTable('removeAll');
  //Загрузка информации в виде таблицы
  get_service_history(host, service)
})
