
var HEADERS = ['full_name', 'score', 'price', 'profit', 'closeness', 'spec_B',
  /*'a', 'q', 'moid',*/ 'dv', 'pha'];
var FUZZY_FIELDS = ['price', 'saved', 'profit'];
var CLOSE_APPROACHES_FIELD = 'Close Approaches';
var lastResults = null;

$(function() {
  $('.exptip').tooltip();
  $('#submit').on('click', doSearch);
  var $tbody = $('#tbl tbody');
  $(document).on('click', '#tbl tbody tr', function(e) {

    $('#instructions').hide();
    var $tbody = $('#details').show().find('tbody').html('Loading...');
    var obj = $(this).attr('data-obj');
    var fullname = $(this).attr('data-full-name');
    mixpanel.track('info', {
      fullname: fullname
    });
    $('#details h2').html(fullname);
    $('html,body').animate({scrollTop: $('#details').offset().top-20},500);

    // workaround for a glitch on mobile devices
    $("#tbl-container").scroll();

    $.getJSON('/info/' + obj, function(result) {
      $tbody.empty();
      for (var x in result.data) {
        if (result.data.hasOwnProperty(x)) {
          var item = result.data[x];
          if (!item) continue;

          if (x === CLOSE_APPROACHES_FIELD) {
            var approaches = '';
            for (var i=0; i < item.length; i++) {
              var distau = parseFloat(item[i].nom_dist_au);
              var rel_velocity = parseFloat(item[i].v_relative);
              approaches += '<tr><td>' + item[i].date + '</td><td>'
                + distau.toFixed(5) + '</td><td>'
                + rel_velocity + '</td></tr>';
            }
            var $row = $('<tr><td>' + x
              + '</td><td><span style="text-decoration:underline;color:blue;cursor:pointer;">view ('
              + item.length
              + ')</span></td></tr>')
              .on('click', function() {
                mixpanel.track('approaches', {
                  fullname: fullname
                });
                $('#close-approaches-name').html(obj);
                $('#approaches-modal tbody').empty().append(approaches);
                $('#approaches-modal').modal();
            });
            $tbody.append($row);
          }
          else {
            if (typeof(item) === 'number') {
              item = item.toFixed(2);
            }
            $tbody.append('<tr><td>' + x + '</td><td>' + item + '</td></tr>');
          }
        }
      }
      // workaround for a glitch on mobile devices
      $("#tbl-container").scroll();

      $('html,body').animate({scrollTop: $('#details').offset().top-20},500);

    });
  });
  $("#tbl").thfloat({
    attachment: '#tbl-container'
  });

  mixpanel.track('home');
});

function doSearch() {
  $('#instructions').show();
  $('#details').hide();
  $('#legend').hide();
  $('#results').hide();
  $('#submit').attr('disabled', 'disabled').val('Loading...');

  // empty graphs
  $('#spec-graph').empty();
  $('#profit-graph').empty();
  $('#profit-graph-legend').empty();

  var $tmp = $('tbody').empty();
  var num_search = parseInt($('#top_num').val());
  var searchparams = {sort:$('#top_sort').val(),n:num_search};
  mixpanel.track('search', searchparams);

  $.getJSON('/top', searchparams, function(data) {
    lastResults = data.results;
    for (var i=0; i < data.results.length; i++) {
      var obj = data.results[i];
      var name = obj.prov_des || obj.full_name;
      var html = '<tr data-full-name="' + obj.full_name + '" data-obj="' + name + '">';
      for (var j=0; j < HEADERS.length; j++) {
        var val = obj[HEADERS[j]];
        if (!val)
          val = '';
        if (typeof (val) === 'number') {
          if ($.inArray(HEADERS[j], FUZZY_FIELDS) > -1) {
            var suffix = obj['inexact'] ? '*' : '';
            val = toFuzz(val) + suffix;
          }
          else {
            val = val.toFixed(4);
          }
        }
        else {
          val = val + '';
          if (val.length > 20) {
            val = val.substring(0,17) + '...';
          }
        }
        html += '<td>' + val + '</td>';
      }
      html += '</tr>';
      $tmp.append(html);
    }
    $('.intro').hide();

    if (navigator && !navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)
      && !($.browser.msie && $.browser.version < 9)) {

      // Exclude mobile devices from the heavy handed stuff :(
      if (num_search <= 9000)
        graphSpectral();
      if (num_search <= 500)
        scatterScore();
    }

    $('#submit').removeAttr('disabled').val('Go');
    $('#tbl tbody').append($tmp.children());
    $('#results').show();
    $('#legend').show();
    $('#tbl-container').height($(window).height() - $('#tbl-container').offset().top);
    $('html,body').animate({scrollTop: $('#tbl-container').offset().top-100},500);
  });
  return false;
}

var fuzzes = [
  {
    word: 'trillion',
    num: 1000000000000
  },
  {
    word: 'billion',
    num: 1000000000
  },
  {
    word: 'million',
    num: 1000000
  }
];

function toFuzz(n) {
  for (var i=0; i < fuzzes.length; i++) {
    var x = fuzzes[i];
    if (n / x.num >= 1) {
      var prefix = (n / x.num);
      if (i==0 && prefix > 100)
        return '>100 ' + x.word;
      return prefix.toFixed(2) + ' ' + x.word;
    }
  }
  return n;
}

function graphSpectral() {
  if (lastResults === null) {
    return;
  }

  var specs_data = [];
  var spec_grouped = _.chain(lastResults).groupBy(function(obj) {
    return obj.spec_B;
  }).map(function(val, key) {
    specs_data.push({
      spec_type: key,
      count: val.length
    });
  });

  specs_data = specs_data.sort(function(a, b) {
    return b.count - a.count;
  });
  barChart(specs_data, 'spec_type', 'count', '#spec-graph');
}

function scatterScore() {

  if (lastResults === null) {
    return;
  }

  var palette = new Rickshaw.Color.Palette( { scheme: 'munin' } );

  var logscores = {};
  var series = _.chain(lastResults).map(function(obj) {
    var logscore = Math.log(obj.score);
    var ret = {
      x: 10-obj.closeness,
      y: logscore,
      stype: obj.spec_B
    };
    // what an ugly hack
    logscores[ret.stype + ',' + ret.x.toFixed(2) + ',' + ret.y.toFixed(2)] = obj;
    return ret;
  }).groupBy(function(obj) {
    return obj.stype;
  }).map(function(objs, stype) {
    return {
      data: objs,
      color: palette.color(),
      name: stype
    };
  }).value();

  Rickshaw.Series.zeroFill(series);

  var graph = new Rickshaw.Graph( {
    element: document.getElementById('profit-graph'),
    width: $(window).width(),
    height: 220,
    min: 1,
    renderer: 'scatterplot',
    series: series
  } );

  graph.renderer.dotSize = 6;
  graph.render();

  var hoverDetail = new Rickshaw.Graph.HoverDetail( {
    graph: graph,
    formatter: function(series, x, y) {

      var key = series.name + ',' + x.toFixed(2) + ',' + y.toFixed(2);
      var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';

      var name = '';
      var valuestr = '';
      var profitstr = '';
      var obj = logscores[key];
      if (obj) {
        name = obj.full_name;
        valuestr = '<br>Value: $' + toFuzz(obj.price);
        profitstr = '<br>Profit: $' + toFuzz(obj.profit);
      }
      var content = swatch
        + name
        + valuestr
        + profitstr
        + '<br>Accessibility: ' + x.toFixed(2)
        + ' <br>Score (log): '
        + y.toFixed(2);
      return content;
    }
  } );

  var legend = new Rickshaw.Graph.Legend({
    graph: graph,
    element: document.getElementById('profit-graph-legend')
  });

  var shelving = new Rickshaw.Graph.Behavior.Series.Toggle({
    graph: graph,
    legend: legend
  });
  var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight({
    graph: graph,
    legend: legend
  });
  /*
  var yAxis = new Rickshaw.Graph.Axis.Y({
    title: 'test',
    graph: graph,
    tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
  });
  yAxis.render();
  */
}

function barChart(data, xattr, yattr, selector) {
  $(selector).empty();

  var padding = 30;

  var barWidth = 20;
  var width = (barWidth + 10) * data.length;
  var height = 100;

  var x = d3.scale.linear().domain([0, data.length]).range([0, width]);
  var y = d3.scale.linear().domain([0, d3.max(data, function(datum) { return datum[yattr]; })]).
    rangeRound([0, height]);

  var barDemo = d3.select(selector).
    append("svg:svg").
    attr("width", width).
    attr("height", height + padding);

  barDemo.selectAll("rect").
    data(data).
    enter().
    append("svg:rect").
    attr("x", function(datum, index) { return x(index); }).
    attr("y", function(datum) { return height - y(datum[yattr]); }).
    attr("height", function(datum) { return y(datum[yattr]); }).
    attr("width", barWidth).
    attr("fill", "#2d578b");

  barDemo.selectAll("text").
    data(data).
    enter().append("svg:text").
    attr("x", function(datum, index) { return x(index) + barWidth; }).
    attr("y", function(datum) { return height - y(datum[yattr]); }).
    attr("dx", -barWidth/2).
    attr("dy", "1.2em").
    attr("text-anchor", "middle").
    attr("style", "font-size: 12; font-family: Helvetica, sans-serif;").
    text(function(datum) { return datum[yattr];}).
    attr("fill", "white");

  if (xattr) {
    barDemo.selectAll("text.yAxis").
      data(data).
      enter().append("svg:text").
      attr("x", function(datum, index) { return x(index) + barWidth; }).
      attr("y", height).
      attr("dx", -barWidth/2).
      attr("text-anchor", "middle").
      attr("style", "font-size: 12; font-family: Helvetica, sans-serif").
      text(function(datum) { return datum[xattr];}).
      attr("transform", "translate(0, 18)").
      attr("class", "yAxis");
  }
}
