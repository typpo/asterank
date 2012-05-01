
$(function() {
  // TODO do ajax manually so we can run transformations on some of this data..
  $('#tbl').dataTable( {
    "bProcessing": true,
    "sAjaxSource": "/top",
    "aoColumns": [
        { "mDataProp": "full_name" },
        { "mDataProp": "score" },
        { "mDataProp": "price" },
        { "mDataProp": "saved" },
        { "mDataProp": "closeness" },
        { "mDataProp": "moid" },
        { "mDataProp": "neo" },
        { "mDataProp": "pha" },
        { "mDataProp": "spec_B" },
        { "mDataProp": "GM" },
        { "mDataProp": "diameter" },
    ]
  } );

});
