
var HEADERS = ['full_name', 'score', 'price', 'saved', 'closeness', 'spec_B', 'pha', 'moid'];

$(function() {
  var $tbody = $('#tbl tbody');
  $.getJSON('/top', function(data) {
    for (var i=0; i < data.results.length; i++) {
      var obj = data.results[i];
      var html = '<tr>';
      for (var j=0; j < HEADERS.length; j++) {
        var val = obj[HEADERS[j]] + '';
        if (val.length > 15) {
          val = val.substring(0,12) + '...';

        }
        html += '<td>' + val + '</td>';
      }
      html += '</tr>';
      $tbody.append(html);
    }
  });

  $(document).on('click', '#tbl tbody tr', function(e) {
    // Update right hand side
  });

});
