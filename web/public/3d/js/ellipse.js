(function() {
  var pi = Math.PI;
  var PIXELS_PER_AU = 50;
  var USE_REAL_ELLIPSE = true;

  var Orbit3D = function(eph, opts, scene) {
    opts = opts || {};
    opts.color = opts.color || 0xffee00;
    opts.width = opts.width || 1;
    opts.object_size = opts.object_size || 2;
    opts.jed =  opts.jed || 2451545.0;

    this.opts = opts;
    this.eph = eph;
    this.ellipse = this.CreateOrbit(opts.jed);
    this.particle = this.CreateParticle(opts.jed);
  }

  Orbit3D.prototype.CreateOrbit = function(jed) {
    var pts;
    var points;
    var time = jed;
    var pts = []
    var limit = this.eph.P ? this.eph.P+1 : this.eph.per;
    var parts = 100;
    var delta = Math.ceil(limit / parts);
    var prev;
    var group = new THREE.Object3D();
    for (var i=0; i <= parts; i++, time+=delta) {
      var pos = this.getPosAtTime(time);
      var vector = new THREE.Vector3(pos[0], pos[1], pos[2]);
      group.add(this.CreateParticle(time));
      prev = vector;
      pts.push(vector);
    }

    points = new THREE.Geometry();
    points.vertices = pts;
    //points.mergeVertices();

    var line = new THREE.Line(points,
      new THREE.LineBasicMaterial({color: this.opts.color, linewidth: this.opts.width}));
    return line;
  }

  Orbit3D.prototype.CreateParticle = function(jed) {
    var geometry= new THREE.SphereGeometry(this.opts.object_size);
    var material= new THREE.MeshBasicMaterial({color: this.opts.color});
    var particle = new THREE.Mesh(geometry, material);
    var pos = this.getPosAtTime(jed);
    particle.position.set(pos[0], pos[1], pos[2]);
    //particle.position.multiplyScalar(PIXELS_PER_AU);

    return particle;
  }

  Orbit3D.prototype.MoveParticle = function(time_jed) {
    var pos = this.getPosAtTime(time_jed);
    this.particle.position.set(pos[0], pos[1], pos[2]);
    //this.particle.position.multiplyScalar(PIXELS_PER_AU);
  }

  Orbit3D.prototype.getPosAtTime = function(jed) {
    //jed = jed || 2451545.0; // 2000 Jan 1.5
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

    var sin = Math.sin, cos = Math.cos;
    // true anomaly approximation, using Equation of Center
    /*
    var v = M + (2 * e - e*e*e/4) * sin(M)
         + 5/4 * e*e * sin(2*M)
         + 13/12 * e*e*e * sin(3*M);
         */
    // Estimate eccentric and true anom using iterative approx
    var E0 = M;
    var lastdiff;
    do {
      var E1 = M + e * sin(E0);
      lastdiff = Math.abs(E1-E0);
      E0 = E1;
    } while(lastdiff > 0.0000001);
    var E = E0;
    var v = 2 * Math.atan(Math.sqrt((1+e)/(1-e)) * Math.tan(E/2));

    // radius vector, in AU
    var r = a * (1 - e*e) / (1 + e * cos(v)) * PIXELS_PER_AU;

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
