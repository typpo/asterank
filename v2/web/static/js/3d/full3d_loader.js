;(function() {
  'use strict';
  var asterank3d = new Asterank3D({
    container: document.getElementById('container'),
    not_supported_callback: function() {
      alert('not supported');
    }
  });
})();
