
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
          var limit = j==0 ? 20 : 12;
          if (val.length > limit) {
            val = val.substring(0,9) + '...';
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
    var $tbody = $('#details').show().find('tbody').html('Loading...');
    var obj = $(this).attr('data-obj');
    $('#details h1').html(obj);
    $.getJSON('/info/' + obj, function(result) {
      $tbody.empty();
      for (var x in result.data) {
        if (result.data.hasOwnProperty(x)) {
          var item = result.data[x];
          if (!item) continue;

          if (x === 'close_approaches') {
            var approaches = '';
            for (var i=0; i < item.length; i++) {
              approaches += '<tr><td>' + item[i].date + '</td><td>' + item[i].nom_dist_au + '</td></tr>';
            }
            item = approaches;

            var $row = $('<tr><td>' + x + '</td><td><span style="text-decoration:underline;color:blue;cursor:pointer;">click to view</span></td></tr>')
              .on('click', function() {
                $('#close-approaches-name').html(obj);
                $('#approaches-modal tbody').empty().append(approaches);
                $('#approaches-modal').modal();
            });
            $tbody.append($row);
          }
          else
            $tbody.append('<tr><td>' + x + '</td><td>' + item + '</td></tr>');
        }
      }

    });
  });

});
