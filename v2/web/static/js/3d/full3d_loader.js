;(function() {
  'use strict';
  var asterank3d = new Asterank3D({
    container: document.getElementById('container'),
    not_supported_callback: function() {
      $('#loading').hide();
      $('#not-supported').show();
    },
    run_asteroid_query: true,
    show_dat_gui: true
  });

  $('#hide_sidebar').on('click', function() {
    $('#sidebar').hide();
  });
})();
