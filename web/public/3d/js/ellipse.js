(function() {
  var pi = Math.PI;
  var PIXELS_PER_AU = 50;

  var Orbit3D = function(eph, opts, scene) {
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

    line.rotation.x = pi/2;
    line.rotation.z = eph.w * pi / 180;
    line.rotation.y = eph.i * pi / 180;

    var material = new THREE.ParticleCanvasMaterial({
      color: 0xffee00,
      program: function (context) {
        context.beginPath();
        context.arc(0, 0, 1, 0, 2*pi, true);
        context.closePath();
        context.fill();
      }
    });
    var particle = new THREE.Particle(material);
    particle.position.x = rx;
    particle.position.y = ry;
    particle.position.z = 1;
    particle.rotation.x = pi/2;
    particle.rotation.z = eph.w * pi / 180;
    particle.rotation.y = eph.i * pi / 180;

    this.object3D = line;
    this.particle = particle;
  }

  Orbit3D.prototype.getObject = function() {
    return this.object3D;
  }

  Orbit3D.prototype.getParticle = function() {
    return this.particle;
  }

  window.Orbit3D = Orbit3D;
})();
