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
  assets.addJs('/public/js/lib/jquery.thfloat.min.js', 'main');
  assets.addJs('/public/js/lib/flotr2.js', 'main');

  /* Orbits assets */
  assets.addJs('/public/js/orbits_view.js', 'orbits-view');
}
