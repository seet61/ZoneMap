var treeData = {};
var serviceArray = [];
var progress = 10;
var step = 10;

function get_data() {
  //Ошибка не выбран сервер получения информации
  if ($('#init_servers option:selected').attr('value') === "" || $('#init_servers option:selected').text() === "Выберите точку отсчета") {
    $('#alert_message').text('Не выбран сервер!');
    $('#alert').attr('hidden', false);
    setTimeout(function() { 
      $('#alert_message').alert('close');
    }, 1000);
    return;
  }

  $('#progress_bar').attr('hidden', false);
  $('#get_data').button('loading');
  //console.log('selected server: ' + $('#init_servers option:selected').attr('value') + " host_ip: " + $('#init_servers option:selected').text());
  $('#bar').attr('style', "width: 1%;");
  $.ajax({
    dataType: "json",
    url: "/platform_services",
    data: {
      serv_id : $('#init_servers option:selected').attr('value'),
      host_ip : $('#init_servers option:selected').text()
    },
    success: onGetDataSuccess,
    error: onError
  });
 
}

function onError() {
  console.log('Ошибка получения информации!');
}

function onGetDataSuccess(data) {
  // Здесь мы получаем данные, отправленные сервером и выводим их на экран.
  $('#bar').attr('style', "width: " + progress + "%;");
  var infoData = JSON.parse(data);
  step = 90/parseInt(infoData["children"].length);
  console.log('infoData step: ' + step);
  var infoArray = [];
  for (var i = 0; i < infoData["children"].length; i++) {
    console.log('data: ' + infoData["children"][i]["name"]);
    serviceArray = [];
    /*global serviceArray + i = [];*/
    //Информация о
    $.ajax({
      dataType: "json",
      async: false,
      url: "/service_about",
      data: {
        serv_id : $('#init_servers option:selected').attr('value'),
        service_name : infoData["children"][i]["name"]
      },
      success: onGeServiceInfo,
      error: onError
    });
    //Получение групп АА для SG
    //console.log('infoData["children"][i]["name"].includes("SG"): ' + infoData["children"][i]["name"].includes("SG") );
    if (infoData["children"][i]["name"].includes("SG")) {
      $.ajax({
      dataType: "json",
      async: false,
      url: "/service_aa",
      data: {
        serv_id : $('#init_servers option:selected').attr('value'),
        service_name : infoData["children"][i]["name"]
      },
      success: onGeServiceInfo,
      error: onError
    });
    }
    //Получение списка артефактов для SLES & LWSA 
    if (infoData["children"][i]["name"].includes("SLES") || infoData["children"][i]["name"].includes("LWSA")) {
      $.ajax({
      dataType: "json",
      async: false,
      url: "/service_artifacts",
      data: {
        serv_id : $('#init_servers option:selected').attr('value'),
        service_name : infoData["children"][i]["name"]
      },
      success: onGeServiceInfo,
      error: onError
    });
    }
    
    //console.log('serviceArray: ' + serviceArray);

    infoArray.push({"name" : infoData["children"][i]["name"], "children" : serviceArray});
    //add progress bar status
    progress += step;
    $('#bar').attr('style', "width: " + progress + "%;");
  }
  //Ждем загрузки всей инфы
  var checkExist = setInterval(function() {
    console.log('processing...' + progress + '%');
    if (parseInt(progress) > 99) {
        clearInterval(checkExist);
        console.log('infoData is done! ' + progress + " " + step);
        treeData = {"name" : $('#init_servers option:selected').text(), "children" : []}
        treeData["children"] = infoArray;
        setTimeout(function() {
          $('#progress_bar').attr('hidden', true);
          $('#get_data').button('reset');
          get_graph();
        }, 500);  
     }
    }, 50); // check every 50ms
  
}

function onGeServiceInfo(data) {
  /* Получение информации о сервисе */
  //console.log('onGeServiceInfo i: ' + i);
  var infoService = JSON.parse(data);
  //console.log('infoService infoArray:' + infoArray);
  serviceArray.push(infoService);
  //console.log('infoService infoArray:' + JSON.stringify(infoArray));
}

function get_graph() {
  //console.log("treeData: " + JSON.stringify(treeData));
  // Set the dimensions and margins of the diagram
  var margin = {top: 20, right: 90, bottom: 30, left: 90},
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate("
            + margin.left + "," + margin.top + ")");

  var i = 0,
      duration = 750,
      root;

  // declares a tree layout and assigns the size
  var treemap = d3.tree().size([height, width]);

  // Assigns parent, children, height, depth
  root = d3.hierarchy(treeData, function(d) { return d.children; });
  root.x0 = height / 2;
  root.y0 = 0;

  // Collapse after the second level
  root.children.forEach(collapse);

  update(root);

  // Collapse the node and all it's children
  function collapse(d) {
    if(d.children) {
      d._children = d.children
      d._children.forEach(collapse)
      d.children = null
    }
  }

  function update(source) {

    // Assigns the x and y position for the nodes
    var treeData = treemap(root);

    // Compute the new tree layout.
    var nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function(d){ d.y = d.depth * 180});

    // ****************** Nodes section ***************************

    // Update the nodes...
    var node = svg.selectAll('g.node')
        .data(nodes, function(d) {return d.id || (d.id = ++i); });

    // Enter any new modes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function(d) {
          return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on('click', click);

    // Add Circle for the nodes
    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style("fill", function(d) {
            return d._children ? "lightsteelblue" : "#fff";
        });

    // Add labels for the nodes
    nodeEnter.append('text')
        .attr("dy", ".35em")
        .attr("x", function(d) {
            return d.children || d._children ? -13 : 13;
        })
        .attr("text-anchor", function(d) {
            return d.children || d._children ? "end" : "start";
        })
        .text(function(d) { return d.data.name; });

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
      .duration(duration)
      .attr("transform", function(d) { 
          return "translate(" + d.y + "," + d.x + ")";
       });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
      .attr('r', 10)
      .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
      })
      .attr('cursor', 'pointer');


    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
      .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
      .style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = svg.selectAll('path.link')
        .data(links, function(d) { return d.id; });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', function(d){
          var o = {x: source.x0, y: source.y0}
          return diagonal(o, o)
        });

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(duration)
        .attr('d', function(d){ return diagonal(d, d.parent) });

    // Remove any exiting links
    var linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', function(d) {
          var o = {x: source.x, y: source.y}
          return diagonal(o, o)
        })
        .remove();

    // Store the old positions for transition.
    nodes.forEach(function(d){
      d.x0 = d.x;
      d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {

      path = `M ${s.y} ${s.x}
              C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`

      return path
    }

    // Toggle children on click.
    function click(d) {
      if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
      update(d);
    }
  }
}