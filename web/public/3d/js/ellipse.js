(function() {
  var pi = Math.PI;
  var PIXELS_PER_AU = 50;

  var Orbit3D = function(eph, opts) {
    opts = opts || {};
    opts.color = opts.color || 0xffee00;
    opts.width = opts.width || 1;

    eph.b = eph.a * Math.sqrt(1 - eph.e * eph.e);
    var rx = eph.a * PIXELS_PER_AU;
    var ry = eph.b * PIXELS_PER_AU;

    var ecurve = new THREE.EllipseCurve(0, 0, rx, ry, 0, 2*pi, true);

    var shape = new THREE.Shape();
    shape.fromPoints(ecurve.getPoints(100));

    var points = shape.createPointsGeometry();
    var line = new THREE.Line(points,
      new THREE.LineBasicMaterial({color: opts.color, linewidth: opts.width}));
    line.position.set(0,0,0);

    // from 0,0,100:
    // view head on from above (Math.PI, Math.PI / 4, 0)
    // view from side, vertically (Math.PI * 2, Math.PI / 4, 0)
    //line.rotation.set( rx, ry, rz );
    line.rotation.x = pi/2;
    line.rotation.z = eph.w * pi / 180;
    line.rotation.y = eph.i * pi / 180;
    // TODO rotate with respect to window, not camera: https://github.com/mrdoob/three.js/issues/910

    //line.scale.set(1,1,1);

    this.object3D = line;
  }

  Orbit3D.prototype.getObject = function() {
    return this.object3D;
  }

  window.Orbit3D = Orbit3D;
})();
