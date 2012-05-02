
var HEADERS = ['full_name', 'score', 'price', 'saved', 'closeness', 'spec_B', 'pha', 'moid'];

$(function() {
  var $tbody = $('#tbl tbody');
  $.getJSON('/top', function(data) {
    for (var i=0; i < data.results.length; i++) {
      var obj = data.results[i];
      var html = '<tr>';
      for (var j=0; j < HEADERS.length; j++) {
        html += '<td>' + obj[HEADERS[j]] + '</td>';
      }
      html += '</tr>';
      $tbody.append(html);
    }

  });

  $(document).on('click', '#tbl tbody tr', function(e) {
    if ($(this).hasClass('row-selected') ) {
      $(this).removeClass('row-selected');
    }
    else {
      $('#tbl tr.row-selected').removeClass('row-selected');
      $(this).addClass('row-selected');
      // TODO open some dialog?
      //
      //$('#object-modal').modal();
    }
  });

});
