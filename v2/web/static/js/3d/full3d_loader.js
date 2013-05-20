;(function() {
  'use strict';

  var start_fn = function() {
    var asterank3d = new Asterank3D({
      container: document.getElementById('container'),
      not_supported_callback: function() {
        $('#loading').hide();
        $('#not-supported').show();
      },
      run_asteroid_query: true,
      show_dat_gui: true,
      static_prefix: window.passthrough_vars.offline_mode ? 'static' : '/static'
    });
  };

  if (window.passthrough_vars.offline_mode) {
    var preload_images = [
      'static/img/cloud4.png',
      'static/img/cloud4-circled.png',
      'static/img/sunsprite.png',
      'static/img/dark-s_px.jpg',
      'static/img/dark-s_nx.jpg',
      'static/img/dark-s_py.jpg',
      'static/img/dark-s_ny.jpg',
      'static/img/dark-s_pz.jpg',
      'static/img/dark-s_nz.jpg'
    ];
    var $img_container = $('<div id="static_images">').hide();

    $.each(preload_images, function() {
      $img_container.append('<img src="' + this + '"/>');
    });
    $img_container.appendTo('body');

    $(window).load(function() {
      start_fn();
    });
  }
  else {
    start_fn();
  }

  $('#hide_sidebar').on('click', function() {
    $('#sidebar').hide();
  });
})();
