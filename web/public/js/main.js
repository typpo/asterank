
var HEADERS = ['full_name', 'score', 'price', 'closeness', 'spec_B',
  'a', 'q', 'moid', 'dv', 'pha','profit'];
var FUZZY_FIELDS = ['price', 'saved', 'profit'];

$(function() {
  $('#submit').on('click', doSearch);
  var $tbody = $('#tbl tbody');
  $(document).on('click', '#tbl tbody tr', function(e) {
    $('#instructions').hide();
    var $tbody = $('#details').show().find('tbody').html('Loading...');
    var obj = $(this).attr('data-obj');
    $('#details h2').html($(this).attr('data-full-name'));
    $('html,body').animate({scrollTop: $('#details').offset().top-20},500);

    // workaround for a glitch on mobile devices
    $("#tbl-container").scroll();

    $.getJSON('/info/' + obj, function(result) {
      $tbody.empty();
      for (var x in result.data) {
        if (result.data.hasOwnProperty(x)) {
          var item = result.data[x];
          if (!item) continue;

          if (x === 'close_approaches') {
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
});

function doSearch() {
  $('#instructions').show();
  $('#details').hide();
  $('#legend').hide();
  $('#results').hide();
  $('#submit').attr('disabled', 'disabled').val('Loading...');
  var $tmp = $('tbody').empty();
  $.getJSON('/top', {sort:$('#top_sort').val(),n:$('#top_num').val()}, function(data) {
    for (var i=0; i < data.results.length; i++) {
      var obj = data.results[i];
      var name = obj.prov_des || obj.full_name;
      var html = '<tr data-full-name="' + obj.full_name + '" data-obj="' + name + '">';
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
          if (val.length > 12) {
            val = val.substring(0,9) + '...';
          }
        }
        html += '<td>' + val + '</td>';
      }
      html += '</tr>';
      $tmp.append(html);
    }
    $('#submit').removeAttr('disabled').val('Go');
    $('#tbl tbody').append($tmp.children());
    $('#results').show();
    $('#legend').show();
    $('html,body').animate({scrollTop: $('#tbl-container').offset().top-60},500);
  });
  return false;
}
