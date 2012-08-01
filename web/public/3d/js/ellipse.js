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
    var phae = (this.eph.full_name.indexOf('Phaethon') > -1);
    var group = new THREE.Object3D();
    var colors = [0xff0000, 0x00ff00, 0x0000ff];
    for (var i=0; i <= parts; i++, time+=delta) {
      var pos = this.getPosAtTime(time);
      var vector = new THREE.Vector3(pos[0], pos[1], pos[2]);
      this.opts.color = colors[Math.floor(parts/i)];
      group.add(this.CreateParticle(time));
      /*
      if (phae && prev) {
        var x = vector.x - prev.x;
        var y = vector.y - prev.y;
        var z = vector.z - prev.z;
        var dist = Math.sqrt(x*x + y*y + z*z);
      }
      */
      prev = vector;
      pts.push(vector);
    }
    if (phae) {
      console.log(pts);
    }

    var dumb_pts = [];
    for (var i=0; i < pts.length; i++) {
      var pt = pts[i];
      if (!pt) continue;
      dumb_pts.push(pt);
      var min = Number.MAX_VALUE;
      var winner = null;
      var winner_idx = -1;
      for (var j=i+1; j < pts.length; j++) {
        var pt2 = pts[j];
        if (!pt2) continue;
        var x = pt.x - pt2.x;
        var y = pt.y - pt2.y;
        var z = pt.z - pt2.z;
        var dist = Math.sqrt(x*x + y*y + z*z);
        if (dist < min) {
          min = dist;
          winner_idx = j;
          winner = pt2;
        }
      }
      if (winner) {
        dumb_pts.push(winner);
        pts[winner_idx] = null;
      }
      pts[i] = null;
    }
    console.log(dumb_pts);

    // Put pts near closest counterpart
    /*
    pts = pts.sort(function(a, b) {
      return Math.random() > .5 ? 1 : -1;
    });
    */

    //return group;

    points = new THREE.Geometry();
    points.vertices = dumb_pts;
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
    var v = M + (2 * e - e*e*e/4) * sin(M)
         + 5/4 * e*e * sin(2*M)
         + 13/12 * e*e*e * sin(3*M);

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
