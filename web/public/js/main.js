
$(function() {
  // TODO do ajax manually so we can run transformations on some of this data..
  $('#tbl').dataTable( {
    "bProcessing": true,
    "sAjaxSource": "/top",
    "aaSorting": [[ 1, "desc" ]],
    "sAjaxDataProp": "results",
    "bJQueryUI": true,
    "aoColumns": [
      { "mDataProp": "full_name" },
      { "mDataProp": "score" },
      { "mDataProp": "price" },
      { "mDataProp": "saved" },
      { "mDataProp": "closeness" },
      { "mDataProp": "moid" },
      { "mDataProp": "pha" },
      { "mDataProp": "spec_B" },
      { "mDataProp": "GM" },
      { "mDataProp": "diameter" },
    ]
  } );

  $(document).on('click', '#tbl tbody tr', function(e) {
    if ($(this).hasClass('row-selected') ) {
      $(this).removeClass('row-selected');
    }
    else {
      $('#tbl tr.row-selected').removeClass('row-selected');
      $(this).addClass('row-selected');
      // TODO open some dialog?
    }
  });

});
