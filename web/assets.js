module.exports = function(assets) {
  assets.root = __dirname;

  /* Shared js assets */
  assets.addJs('/public/js/shared_util.js', 'shared');
  assets.addJs('/public/js/lib/underscore-min.js', 'shared');
  assets.addJs('/public/js/lib/bs.js', 'shared');

  assets.addJs('/public/js/orbit.js', 'shared');
  assets.addJs('/public/js/lib/d3.v2.js', 'shared');

  /* Main page assets */
  assets.addJs('/public/js/main.js', 'main');
  assets.addJs('/public/js/orbits_view.js', 'main');
  assets.addJs('/public/js/autocomplete.js', 'main');
  assets.addJs('/public/js/lib/jquery.thfloat.min.js', 'main');
  assets.addJs('/public/js/lib/flotr2.js', 'main');
  assets.addJs('/public/js/lib/parser.js', 'main');
  assets.addJs('/public/js/lib/jquery.autocomplete.js', 'main');

  /* Orbits assets */
  assets.addJs('/public/js/orbits_view.js', 'orbits-view');

  /* 3d orbits assets */
/*
  assets.addJs('/public/3d/js/vendor/three.js/Three.min.js', 'orbits-3d');
  assets.addJs('/public/3d/js/vendor/three.js/Detector.js', 'orbits-3d');
  assets.addJs('/public/3d/js/vendor/threex/THREEx.WindowResize.js', 'orbits-3d');
  assets.addJs('/public/3d/js/vendor/threex/threex.domevent.js', 'orbits-3d');
  assets.addJs('/public/3d/js/vendor/threex/threex.domevent.object3d.js', 'orbits-3d');
  assets.addJs('/public/3d/js/js/trackballx.js', 'orbits-3d');

  //assets.addJs('/public/js/lib/jquery.min.js', 'orbits-3d');

  assets.addJs('/public/3d/js/vendor/dat.gui.min.js', 'orbits-3d');
  assets.addJs('/public/3d/js/vendor/date.js', 'orbits-3d');

  assets.addJs('/public/3d/js/js/util.js', 'orbits-3d');
  assets.addJs('/public/3d/js/js/Worker.js', 'orbits-3d');
  assets.addJs('/public/3d/js/js/ephemeris.js', 'orbits-3d');
  assets.addJs('/public/3d/js/js/ellipse.js', 'orbits-3d');
  assets.addJs('/public/3d/js/js/main.js', 'orbits-3d');
*/
}
