
var HEADERS = ['full_name', 'score', 'price', 'saved', 'closeness', 'spec_B', 'a', 'q', 'moid', 'dv', 'pha'];
var FUZZY_FIELDS = ['price', 'saved'];

$(function() {
  var $tbody = $('#tbl tbody');
  $.getJSON('/top', function(data) {
    for (var i=0; i < data.results.length; i++) {
      var obj = data.results[i];
      var name = obj.prov_des || obj.full_name;
      var html = '<tr data-obj="' + name + '">';
      for (var j=0; j < HEADERS.length; j++) {
        var val = obj[HEADERS[j]];
        if (!val)
          val = '';
        if (typeof (val) === 'number' && $.inArray(HEADERS[j], FUZZY_FIELDS) > -1) {
          var suffix = obj['inexact'] ? '*' : '';
          val = toFuzz(val) + suffix;
        }
        else {
          val = val + '';
          if (val.length > 15) {
            val = val.substring(0,12) + '...';
          }
        }
        html += '<td>' + val + '</td>';
      }
      html += '</tr>';
      $tbody.append(html);
    }
  });

  $(document).on('click', '#tbl tbody tr', function(e) {
    $('#instructions').hide();
    var $table = $('#details').show().find('table').html('Loading...');
    var obj = $(this).attr('data-obj');
    $('#details h1').html(obj);
    $.getJSON('/info/' + obj, function(result) {
      $table.empty();
      for (var x in result.data) {
        if (result.data.hasOwnProperty(x)) {
          $table.append('<tr><td>' + x + '</td><td>' + result.data[x] + '</td></tr>');
        }
      }

    });
  });

});
