var HEADERS = ['full_name', 'score', 'price', 'profit', 'closeness', 'spec_B',
  /*'a', 'q', 'moid',*/ 'dv', 'pha'];
var FUZZY_FIELDS = ['price', 'saved', 'profit'];
var CLOSE_APPROACHES_FIELD = 'Close Approaches';
var NEXT_PASS_FIELD = 'Next Pass';
var lastResults = null;
var compositions = null;
var tableStretched = false;
var isMobile = false;

$(function() {
  isMobile = $(window).width() < 800; //!navigator.userAgent.match(/(iPhone|iPod|Android|BlackBerry)/)
  $('.exptip').tooltip();
  $('#submit').on('click', doSearch);
  $(document).on('click', '#tbl tbody tr', onTableClick);
  $("#tbl").thfloat({
    attachment: '#tbl-container'
  });
  mixpanel.track('home');
  _gaq.push(['_trackEvent', 'home', 'arrived', '']);
});

function onTableClick() {
  $('#instructions').hide();
  var $tbody = $('#details').show().find('tbody').html('Loading...');
  var obj = $(this).attr('data-obj');
  var obj_type = $(this).attr('data-obj_type');
  var fullname = $(this).attr('data-full-name');
  mixpanel.track('info', {
    fullname: fullname
  });
  _gaq.push(['_trackEvent', 'info', 'clicked', fullname]);
  $('#details h2').html(fullname);
  /*
  var freebase_query = obj.replace(' ', '_').toLowerCase();
  $('#details-img').attr('src', 'https://usercontent.googleapis.com/freebase/v1/image/en/' + freebase_query + '?maxwidth=200');
  */
  if (isMobile) $('html,body').animate({scrollTop: $('#details').offset().top-20},500);

  // workaround for a glitch on mobile devices
  $("#tbl-container").scroll();

  // orbital diagram
  var a = parseFloat($(this).attr('data-obj_a'));
  var e = parseFloat($(this).attr('data-obj_e'));
  if (supportsSvg()) {
    $('#orbit-viz-container').show();
    renderOrbitalDiagram(a, e);
  }

  $.getJSON('/info/' + obj, function(result) {
    renderInfoPane(result, obj, obj_type, fullname, $tbody);
  });
}

function renderInfoPane(result, obj, obj_type, fullname, $tbody) {
  $tbody.empty();
  for (var x in result.data) {
    if (!result.data.hasOwnProperty(x)) continue;
    var item = result.data[x];
    if (!item) continue;

    if (x === CLOSE_APPROACHES_FIELD) {
      // Build approaches table
      var approaches = '';
      for (var i=0; i < item.length; i++) {
        var distau = parseFloat(item[i].nom_dist_au);
        var rel_velocity = parseFloat(item[i].v_relative);
        approaches += '<tr><td>' + item[i].date + '</td><td>'
          + distau.toFixed(3) + '</td><td>'
          + rel_velocity.toFixed(3) + '</td></tr>';
      }
      var $row = $('<tr><td>' + x
        + '</td><td><span style="text-decoration:underline;color:blue;cursor:pointer;">view ('
        + item.length
        + ')</span></td></tr>')
        .on('click', function() {
          mixpanel.track('approaches', {
            fullname: fullname
          });
          _gaq.push(['_trackEvent', 'approaches', 'clicked', fullname]);
          $('#close-approaches-name').html(obj);
          $('#approaches-modal tbody').empty().append(approaches);
          $('#approaches-modal').modal();
      });
      $tbody.append($row);
    }
    else if (x === NEXT_PASS_FIELD) {
      $tbody.append('<tr><td>' + x + '</td><td>' + item.date + '</td></tr>');
    }
    else {
      if (typeof(item) === 'number') {
        item = item.toFixed(2);
        if (item == -1)
          continue;
      }
      $tbody.append('<tr><td>' + x + '</td><td>' + item + '</td></tr>');
    }
  }
  // orbit link
  var jplstr = obj;
  $tbody.append('<tr><td>Orbit</td><td><a style="text-decoration:underline;color:blue;" target="_blank" href="http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=' + jplstr + ';orb=1">link</a></td></tr>');

  // mapping link
  var composition = _.keys(compositions[obj_type]).join(', ');
  $tbody.append('<tr><td>Contains</td><td>' + composition + '</td></tr>');

  // workaround for a glitch on mobile devices
  $("#tbl-container").scroll();

  // stretch the table to match data height
  if (!tableStretched) {
    $('#tbl-container').height($(document).height() - $('#tbl-container').offset().top);
    tableStretched = true;
  }

  if (isMobile) $('html,body').animate({scrollTop: $('#details').offset().top-20},500);
}

function doSearch(preselect) {
  $('#instructions').show();
  $('#details').hide();
  $('#legend').hide();
  $('#results').hide();
  $('#chart-title').hide();
  $('#tbl-title').hide();
  $('#chart-container').hide();
  $('#submit').attr('disabled', 'disabled').val('Loading...');

  // empty graphs
  $('#spec-graph').empty();
  $('#profit-graph').empty();
  $('#profit-graph-legend').empty();

  var num_search = parseInt($('#top_num').val());
  var searchparams = {sort:$('#top_sort').val(),n:num_search};
  mixpanel.track('search', searchparams);
  _gaq.push(['_trackEvent', 'search', 'clicked', searchparams.sort]);
  $.getJSON('/top', searchparams, function(data) {
    renderMainTable(data, num_search);
    if (preselect) {
      var preselect_match = $('#tbl tbody tr[data-full-name="' + preselect + '"]');
      if (preselect_match.length < 1) {
        // Could be a jpl short name
        $('#tbl tbody tr[data-obj="' + preselect + '"]').trigger('click');
      }
      else {
        preselect_match.trigger('click');
      }
    }
  });
  return false;
}

function renderMainTable(data, num_search) {
  var $tmp = $('<tbody>');
  lastResults = data.results.rankings;
  compositions = data.results.compositions;
  for (var i=0; i < lastResults.length; i++) {
    var obj = lastResults[i];
    var name = obj.prov_des || obj.full_name;
    var html = '<tr data-full-name="' + obj.full_name
      + '" data-obj="' + name
      + '" data-obj_type="' + obj.spec_B
      + '" data-obj_a="' + obj.a
      + '" data-obj_e="' + obj.e
      + '">';
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
        val = truncateText(val + '', 20);
      }
      html += '<td>' + val + '</td>';
    }
    html += '</tr>';
    $tmp.append(html);
  }
  $('#landing-page').hide();
  $('#footer').detach().appendTo('#other-footer-container').show();

  // really this should be a screen size thing
  if (navigator && !isMobile && supportsSvg()) {
    if (num_search <= 9000)
      graphSpectral();
    if (num_search <= 500) {
      $('#chart-title').show();
      scatterScore();
    }
  }
  $('#submit').removeAttr('disabled').val('Go');
  $('#tbl tbody').append($tmp.children());
  $('#results').show();
  $('#legend').show();
  $('#tbl-title').show();
  $('#tbl-container').height($(window).height() - $('#tbl-container').offset().top);
  if (isMobile) $('html,body').animate({scrollTop: $('#tbl-container').offset().top-100},500);
}

/* Graphing */

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
  lastResults = lastResults.sort(function(a,b) {
    return a.closeness - b.closeness;
  });
  var series = _.chain(lastResults).map(function(obj) {
    var ret = {
      x: Math.log(obj.closeness),
      y: Math.log(obj.score),
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

  var chartwidth = $(window).width() - 160;
  var graph = new Rickshaw.Graph({
    element: document.getElementById('profit-graph'),
    width: chartwidth,
    height: 220,
    min: 1,
    renderer: 'scatterplot',
    series: series
  });

  graph.renderer.dotSize = 6;
  graph.render();

  $('#chart-container').show();
  $('#chart-container').css('width', chartwidth);
  $('#profit-graph-legend').css('top', $('#chart-container').offset().top);
  $('#profit-graph-legend').css('overflow', $('#chart-container').offset().top);

  var hoverDetail = new Rickshaw.Graph.HoverDetail({
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
        + '<br>Accessibility (log): ' + x.toFixed(2)
        + ' <br>Score (log): '
        + y.toFixed(2);
      return content;
    }
  });

  var legend = new Rickshaw.Graph.Legend({
    graph: graph,
    element: document.getElementById('profit-graph-legend')
  });
  $('#profit-graph-legend').prepend('<p style="text-align:center;font-weight:bold;">Asteroid Type</p>');

  var shelving = new Rickshaw.Graph.Behavior.Series.Toggle({
    graph: graph,
    legend: legend
  });
  var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight({
    graph: graph,
    legend: legend
  });
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

/* Utilities */

function supportsSvg() {
  return !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect;
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

function truncateText(txt, len) {
  if (txt.length > len) {
    txt = txt.substring(0,len-3) + '...';
  }
  return txt;
}
