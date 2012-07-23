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
    line.rotation.y = (this.eph.i * pi / 180) - (Ephemeris.earth.i * pi/180);
    line.rotation.z = this.eph.w * pi / 180;

    this.object3D = line;
  }

  Orbit3D.prototype.CreateParticle = function() {
    // http://www.davidcolarusso.com/astro/
    // http://www.stargazing.net/kepler/ellipse.html#twig02a

    console.log(this.eph.name);
    //var M = this.eph.M;
    var e = this.eph.e;
    var a = this.eph.a;
    var i = this.eph.i;
    var o = this.eph.O; // longitude of ascending node
    var p = this.eph.w; // longitude of perihelion
    var L = this.eph.L; // mean longitude
    var M =  pi/180 * (L - p); // mean anomaly on date of elements
    M = (M + pi) / 2*pi;
    M = (M - Math.floor(M)) * 2*pi - pi; // modulo 180
    //M = 180/pi * (2 * pi) / Math.pow(a, 3/2);
    //console.log('M2', M);

    var sin = Math.sin, cos = Math.cos;

    // true anomaly approximation, using Equation of Center
    M=254.895962*pi/180;
    e = 0.0934231
    var v = M + (2 * e - e*e*e/4) * sin(M)
         + 5/4 * e*e * sin(2*M)
         + 13/12 * e*e*e * sin(3*M);
    console.log('M=', M, 'v=', v*180/pi);
    console.log(v*pi/180, '=?', 2*e*sin(M*pi/180)*60);

    // radius vector, in AU
    var r = a * (1 - e*e) / (1 + e * cos(v));

    // heliocentric coords
    var X = r * (cos(o) * cos(v + p - o) - sin(o) * sin(v + p - o) * cos(i))
    var Y = r * (sin(o) * cos(v + p - o) + cos(o) * sin(v + p - o) * cos(i))
    var Z = r * (sin(v + p - o) * sin(i))

    var x = X;
    var y = Z //Y * cos(i) - Z * sin(i);
    var z = Y //Y * sin(i) + Z * cos(i);

    //console.log(X, Y, Z);

    /*
    var material = new THREE.ParticleCanvasMaterial({
      color: this.opts.color,
      program: function (context) {
        context.beginPath();
        context.arc(0, 0, 1, 0, 2*pi, true);
        context.closePath();
        context.fill();
      }
    });
    var particle = new THREE.Particle(material);
    */
    var geometry= new THREE.SphereGeometry(1);
    var material= new THREE.MeshBasicMaterial({color: this.opts.color});
    var particle = new THREE.Mesh(geometry, material);
    particle.position.x = x;
    particle.position.y = y;
    particle.position.z = z;
    particle.position.multiplyScalar(PIXELS_PER_AU);

    /*
    particle.rotation.x = pi/2;
    particle.rotation.z = this.eph.w * pi / 180;
    particle.rotation.y = this.eph.i * pi / 180;
    */

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
