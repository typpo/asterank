;(function() {
  'use strict';

  var asterank3d = new Asterank3D({
    container: document.getElementById('container'),
    not_supported_callback: function() {
      $('#loading').hide();
      $('#not-supported').show();
    },
    run_asteroid_query: true,
    show_dat_gui: !isMobileOrTablet(),
    static_prefix: window.passthrough_vars.offline_mode ? 'static' : '/static'
  });

  if (window.passthrough_vars.offline_mode) {
    var $canvi = $('canvas');
    if ($canvi.length > 1) {
      // workaround for three.js bug in file:// mode
      $('canvas:first').remove();
    }
  }

  // Other wiring

  $('#hide_sidebar').on('click', function() {
    $('#sidebar').hide();
    $('#show_sidebar_container').show();
  });
  $('#show_sidebar').on('click', function() {
    $('#sidebar').show();
    $('#show_sidebar_container').hide();
  });

  function isMobileOrTablet() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }
})();
