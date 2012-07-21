(function() {
  var pi = Math.PI;
  var PIXELS_PER_AU = 50;

  var Orbit3D = function(eph, opts, scene) {
    opts = opts || {};
    opts.color = opts.color || 0xffee00;
    opts.width = opts.width || 1;

    this.opts = opts;
    this.eph = eph;
    this.CreateOrbit();
    this.CreateParticle();
  }

  Orbit3D.prototype.CreateOrbit = function() {
    this.eph.b = this.eph.a * Math.sqrt(1 - this.eph.e * this.eph.e);
    var rx = this.eph.a * PIXELS_PER_AU;
    var ry = this.eph.b * PIXELS_PER_AU;

    var ecurve = new THREE.EllipseCurve(0, 0, rx, ry, 0, 2*pi, true);

    var shape = new THREE.Shape();
    shape.fromPoints(ecurve.getPoints(100));

    var points = shape.createPointsGeometry();
    var line = new THREE.Line(points,
      new THREE.LineBasicMaterial({color: this.opts.color, linewidth: this.opts.width}));
    line.position.set(0,0,0);

    line.rotation.x = pi/2;
    line.rotation.z = this.eph.w * pi / 180;
    line.rotation.y = this.eph.i * pi / 180;

    this.object3D = line;
  }

  Orbit3D.prototype.CreateParticle = function() {
    // http://www.davidcolarusso.com/astro/
    // http://www.stargazing.net/kepler/ellipse.html#twig02a

    var M = this.eph.M;
    var e = this.eph.e;
    var a = this.eph.a;
    var i = this.eph.i;
    var o = this.eph.O; // longitude of ascending node
    var p = this.eph.w; // longitude of perihelion

    var sin = Math.sin, cos = Math.cos;

    // true anomaly
    var v = M + 180/pi * ( (2 * e - e*e*e/4) * sin(M)
                                 + 5/4 * e*e * sin(2*M)
                                 + 13/12 * e*e*e * sin(3*M));

    // radius vector, in AU
    var r = a * (1 - e*e) / (1 + e * cos(v)) * PIXELS_PER_AU;

    // heliocentric coords
    var X = r * [cos(o) * cos(v + p - o) - sin(o) * sin(v + p - o) *
    cos(i)]
    var Y = r * [sin(o) * cos(v + p - o) + cos(o) * sin(v + p - o) *
    cos(i)]
    var Z = r * [sin(v + p - o) * sin(i)]

    console.log(X, Y, Z);

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
    particle.position.x = X;
    particle.position.y = Y;
    particle.position.z = Z;
    //particle.rotation.x = pi/2;
    //particle.rotation.z = this.eph.w * pi / 180;
    //particle.rotation.y = eph.i * pi / 180;

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
