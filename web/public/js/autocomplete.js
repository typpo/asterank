function Autocomplete(selector) {

  var me = this;
  var $el = $(selector);

  function _Init() {

    $('#direct-lookup-suggestions').css({
      left: $('#direct-lookup').offset().left - 25

    });
    $el.autocomplete({
      minChars: 3,
      serviceUrl: '/autocomplete',
      paramName: 'query',
      transformResult: function(resp) {
        var ret = $.map(resp.data, function(item) {
          return {value: item.full_name, data: item.full_name};
        });
        return ret;
      },
      onSelect: function(suggestion) {
        alert(suggestion.value);
      },
      appendTo: '#direct-lookup-suggestions'
    });
  }

  _Init();
}
