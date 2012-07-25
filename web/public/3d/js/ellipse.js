(function() {
  var pi = Math.PI;
  var PIXELS_PER_AU = 50;
  var USE_REAL_ELLIPSE = true;

  var Orbit3D = function(eph, opts, scene) {
    opts = opts || {};
    opts.color = opts.color || 0xffee00;
    opts.width = opts.width || 1;
    opts.object_size = opts.object_size || 2;

    this.opts = opts;
    this.eph = eph;
    this.ellipse = this.CreateOrbit();
    this.CreateParticle();
  }

  Orbit3D.prototype.CreateOrbit = function() {
    var a = this.eph.a;
    var e = this.eph.e;
    var b = a * Math.sqrt(1 - e*e);
    var f = a * e;
    var rx = a * PIXELS_PER_AU;
    var ry = b * PIXELS_PER_AU;
    var rf = f * PIXELS_PER_AU;

    var shape = new THREE.Shape();
    var pts;
    var points;
    var time = 2451545.0
    var pts = []
    var limit = this.eph.P ? this.eph.P+1 : this.eph.per;
    var parts = 100;
    var delta = Math.ceil(limit / parts);
    for (var i=0; i <= parts; i++, time+=delta) {
      // months
      var pos = this.getPosAtTime(time);
      var vector = new THREE.Vector3(pos[0], pos[1], pos[2]);
      vector.multiplyScalar(PIXELS_PER_AU);
      pts.push(vector);
    }
    //shape.fromPoints(pts);
    points = new THREE.Geometry();
    points.vertices = pts;
    points.mergeVertices();

    var line = new THREE.Line(points,
      new THREE.LineBasicMaterial({color: this.opts.color, linewidth: this.opts.width}));
    return line;
  }

  Orbit3D.prototype.CreateParticle = function() {
    var geometry= new THREE.SphereGeometry(this.opts.object_size);
    var material= new THREE.MeshBasicMaterial({color: this.opts.color});
    var particle = new THREE.Mesh(geometry, material);
    var pos = this.getPosAtTime();  // position at epoch
    particle.position.x = pos[0];
    particle.position.y = pos[1];
    particle.position.z = pos[2];
    particle.position.multiplyScalar(PIXELS_PER_AU);

    this.particle = particle;
  }

  Orbit3D.prototype.getPosAtTime = function(jed) {
    jed = jed || 2451545.0; // 2000 Jan 1.5
    var e = this.eph.e;
    var a = this.eph.a;
    var i = (this.eph.i-Ephemeris.earth.i) * pi/180;
    var o = (this.eph.om-Ephemeris.earth.om) * pi/180; // longitude of ascending node
    var p = this.eph.w * pi/180; // longitude of perihelion
    var ma = this.eph.ma;
    var M;
    // Calculate mean anomaly at J2000
    ma = ma * pi/180;
    var n;
    if (this.eph.n)
      n = this.eph.n * pi/180; // mean motion
    else {
      n = 2*pi / this.eph.P;
    }
    var epoch = this.eph.epoch;
    var d = epoch - jed;
    //L = ma + p;
    //M =  n * -d + L - p;
    M = ma + n * -d;
    // TODO do this smarter
    while (M < 0) {
      M += 2*pi;
    }
    while (M > 2*pi) {
      M -= 2*pi;
    }

    // http://www.stargazing.net/kepler/ellipse.html#twig02a
    var sin = Math.sin, cos = Math.cos;

    // true anomaly approximation, using Equation of Center
    var v = M + (2 * e - e*e*e/4) * sin(M)
         + 5/4 * e*e * sin(2*M)
         + 13/12 * e*e*e * sin(3*M);

    // radius vector, in AU
    var r = a * (1 - e*e) / (1 + e * cos(v));

    // heliocentric coords
    var X = r * (cos(o) * cos(v + p - o) - sin(o) * sin(v + p - o) * cos(i))
    var Y = r * (sin(o) * cos(v + p - o) + cos(o) * sin(v + p - o) * cos(i))
    var Z = r * (sin(v + p - o) * sin(i))
    return [X, Y, Z];
  }

  Orbit3D.prototype.getObject = function() {
    return this.ellipse;
  }

  Orbit3D.prototype.getParticle = function() {
    return this.particle;
  }

  window.Orbit3D = Orbit3D;
})();
