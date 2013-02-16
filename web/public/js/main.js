window.Asterank = (function() {
  "use strict";

  var HEADERS = ['full_name', 'score', 'price', 'profit', 'closeness', 'spec_B',
    'dv', 'pha'];
  var FUZZY_FIELDS = ['price', 'saved', 'profit'];
  var CLOSE_APPROACHES_FIELD = 'Close Approaches';
  var NEXT_PASS_FIELD = 'Next Pass';
  var lastResults = null;
  var compositions = null;
  var tableStretched = false;
  var isMobile = false;
  var AsteroidOrbitRenderer = null;
  var AutocompleteWidget = null;

  function Asterank() {
    var me = this;
    $(function() {
      isMobile = $(window).width() < 800; //!navigator.userAgent.match(/(iPhone|iPod|Android|BlackBerry)/)
      $('.exptip').tooltip();

      // click handlers etc.
      $('#submit').on('click', function() {
        me.search();
        return false;
      });
      $('#show-custom-sort-modal').on('click', function() {
        $('#custom-sort-modal').modal();
        return false;
      })
      $('#custom-sort-modal').on('hidden', function() {
        var expr = $('#custom-expr').val();
        lastResults = me.applyCustomSort(expr);
        // rerender with newly sorted results
        me.renderMainTable(null, lastResults.length);

      });
      $(document).on('click', '#tbl tbody tr', function() {
        me.handleTableClick($(this));
      });
      $("#tbl").thfloat({
        attachment: '#tbl-container'
      });
      AsteroidOrbitRenderer = new OrbitDiagram('#orbit-viz');
      AutocompleteWidget = new Autocomplete('#direct-lookup');
      mixpanel.track('home');
      _gaq.push(['_trackEvent', 'home', 'arrived', '']);
    });
  }

  Asterank.prototype.handleTableClick = function($e) {
    var me = this;
    $('#instructions').hide();
    $('#details').detach().appendTo('#main-details-container');
    var $tbody = $('#details').show().find('tbody').html('Loading...');
    var obj = $e.attr('data-obj');
    var obj_type = $e.attr('data-obj_type');
    var fullname = $e.attr('data-full-name');
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
    var a = parseFloat($e.attr('data-obj_a'));
    var e = parseFloat($e.attr('data-obj_e'));
    var w = parseFloat($e.attr('data-obj_w'));
    if (supportsSvg()) {
      $('#orbit-viz-container').show();
      AsteroidOrbitRenderer.render(a, e, w);
    }

    $.getJSON('/info/' + obj, function(result) {
      me.renderInfoPane(result, obj, obj_type, fullname, $tbody);
    });
  }

  Asterank.prototype.renderInfoPane = function(result, obj, obj_type, fullname, $tbody) {
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
    $tbody.append('<tr><td>Orbit</td><td><a style="text-decoration:underline;color:blue;" target="_blank" href="http://ssd.jpl.nasa.gov/sbdb.cgi?sstr='
                  + jplstr + ';orb=1">link</a></td></tr>');

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

  Asterank.prototype.search = function(preselect) {
    var me = this;
    $('#instructions').show();
    $('#details').hide();
    $('#legend').hide();
    $('#results').hide();
    $('#chart-title').hide();
    $('#tbl-spacer').hide();
    //$('#chart-container').hide();
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
      lastResults = data.results.rankings;
      compositions = data.results.compositions;
      me.renderMainTable(data, num_search);
      if (preselect) {
        me.selectObject(preselect);
      }
    });
    return false;
  }

  Asterank.prototype.getCompositions = function(cb) {
    // gets compositions if it's not already gotten in top response
    if (compositions) {
      cb();
    }
    else {
      $.getJSON('/compositions', function(result) {
        compositions = result.data;
        cb();
      });
    }
  }

  Asterank.prototype.renderMainTable = function(data, num_search) {
    var $tmp = $('<tbody>');
    for (var i=0; i < lastResults.length; i++) {
      var obj = lastResults[i];
      var name = obj.prov_des || obj.full_name;
      var html = '<tr data-full-name="' + obj.full_name
        + '" data-obj="' + name
        + '" data-obj_type="' + obj.spec_B
        + '" data-obj_a="' + obj.a
        + '" data-obj_e="' + obj.e
        + '" data-obj_w="' + obj.w
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

    $('#submit').removeAttr('disabled').val('Go');
    $('#tbl tbody').empty().append($tmp.children());
    $('#results').show();
    $('#legend').show();
    $('#tbl-spacer').show();

    if (navigator && !isMobile && supportsSvg()) {
      if (num_search <= 9000) {
        graphSpectral();
      }
      if (num_search <= 500) {
        $('#chart-container').show();
        $('#chart-title').show();
        scatterScore();
        new OrbitsView('#orbits-view-main', '#orbits-view-info-text').addAllOrbits();
      }
    }

    // now scroll into place
    $('#tbl-container').height($(window).height() - $('#tbl-container').offset().top);
    if (isMobile) $('html,body').animate({scrollTop: $('#tbl-container').offset().top-100},500);
  }

  Asterank.prototype.selectObject = function(preselect) {
    // User preselected a specific object
    var preselect_match = $('#tbl tbody tr[data-full-name="' + preselect + '"]');
    if (preselect_match.length < 1) {
      // Could be a jpl short name
      var preselect_match = $('#tbl tbody tr[data-obj="' + preselect + '"]')
    }
    if (preselect_match.length > 0) {
      preselect_match
        .css('font-weight', 'bold')
        .trigger('click');
      var container = $('#tbl-container');
      container.scrollTop(preselect_match.position().top - container.offset().top - 50);
    }
  }

  Asterank.prototype.getLastResults = function() {
    return lastResults;
  }

  Asterank.prototype.applyCustomSort = function(expr) {
    mixpanel.track('custom sort', {expr: expr});
    var results = _.map(lastResults, function(a) {
      a.score = Parser.evaluate(expr, {
        GM: a.GM == "" ? 0 : a.GM,
        a: a.a,
        diameter: a.diameter,
        e: a.e,
        i: a.i,
        moid: a.moid,
        neo: a.neo === 'Y' ? 1 : 0,
        pha: a.pha === 'Y' ? 1 : 0,
        q: a.q,
        w: a.w,
        price: a.price,
        profit: a.profit,
        closeness: a.closeness,
        om: a.om,
        ma: a.ma,
        n: a.n,
        per: a.per,
        dv: a.dv || 6.5, // default dv
        eopch: a.epoch
        // tp?
      });
      return a;
    });
    var comparator = function(a, b) {
      return b.score - a.score;
    }
    return results.sort(comparator);
  }

  return new Asterank;
})();

/* Graphing */
function graphSpectral() {
  var lastResults = Asterank.getLastResults();
  if (lastResults === null) return;

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
  var lastResults = Asterank.getLastResults();
  if (lastResults === null) return;

  var logscores = {};
  var sorted_results = lastResults.sort(function(a,b) {
    return a.closeness - b.closeness;
  });
  var stype_to_datapoints;
  var series = _.chain(sorted_results).map(function(obj) {
    return [
      obj.closeness,
      Math.log(obj.score),
      obj.spec_B,
      obj
    ];
  }).groupBy(function(obj) {
    return obj[2];
  }).tap(function(value) {
    stype_to_datapoints = value;
  }).map(function(objs, stype) {
    return {
      data: objs,
      color: '#'+Math.floor(Math.random()*16777215).toString(16),
      label: stype,
      points: {show: true}
    };
  }).value();

  // render here
  //$('#chart').height();

  graph = Flotr.draw(
    $('#chart').get(0), series, {
      legend : { container: $('#chart-legend').get(0) },
      title : 'Value (log) vs. Ease of Access',
      fontColor: '#fff',
      mouse : {
        track : true,
        relative : true,
        trackFormatter: function(obj) {
          var obj = stype_to_datapoints[obj.series.label][obj.index][3];
          return obj.full_name
            + '<br>Type: ' + obj.spec_B
            + '<br>Value: $' + toFuzz(obj.price)
            + '<br>Accessibility Score: ' + obj.closeness.toFixed(4);
        },
        radius: 5,
        sensibility: 5
      },
      grid: {
        backgroundColor: '#404040',
        tickColor: '#fff'
      }
    }
  );
}

function barChart(data, xattr, yattr, selector) {
  $(selector).empty();

  var padding = 30;

  var barWidth = 16;
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
