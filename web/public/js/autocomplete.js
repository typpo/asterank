function Autocomplete(selector) {

  var me = this;
  var $el = $(selector);

  function _Init() {

    _SetupAutoComplete();
    _SetupHandlers();

  }

  function _SetupHandlers() {
    $('#direct-lookup-link').on('click', function() {
      $('#lookup-modal').modal();

      // position suggestions menu
      $('#direct-lookup-suggestions').css({
        left: $('#direct-lookup').offset().left - 300
      });

      $('#direct-lookup').focus();

      return false;
    });
    $('#lookup-modal a.close').on('click', function() {
      $('#lookup-modal').modal('close');
      return false;
    });

  }

  function _SetupAutoComplete() {
    var last_suggestion = null;
    $el.autocomplete({
      minChars: 3,
      serviceUrl: '/autocomplete',
      paramName: 'query',
      transformResult: function(resp) {
        var ret = $.map(resp.data, function(item) {
          return {value: item.full_name, data: item.prov_des};
        });
        return ret;
      },
      onSelect: function(suggestion) {
        _NavToObject(suggestion.data);
      },
      appendTo: '#direct-lookup-suggestions'
    });
    $('#lookup-modal form').on('submit', function() {
      return false;
    });
  }

  function _NavToObject(prov_des) {
    $('#details').detach().appendTo('#main-details-container');
    $('#lookup-details').empty();
    Asterank.getCompositions(function() {
      $.getJSON('/info/' + prov_des, function(result) {
        Asterank.renderInfoPane(result, 'test_obj', 'O', prov_des,
          $('#details').show().find('tbody'));
        $('#details').detach().appendTo('#lookup-details');
      });
    });

  }

  _Init();
}
