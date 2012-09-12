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
    this.particle_geometry = opts.particle_geometry;
    this.pos_cache = {};
    this.particle = this.CreateParticle(opts.jed);
  }

  Orbit3D.prototype.CreateOrbit = function(jed) {
    var pts;
    var points;
    var time = jed;
    var pts = []
    var limit = this.eph.P ? this.eph.P+1 : this.eph.per;
    var parts = this.eph.e > .20 ? 300 : 100;   // extra precision for high eccentricity
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

    var line = new THREE.Line(points,
      new THREE.LineBasicMaterial({color: this.opts.color, linewidth: this.opts.width}));
    return line;
  }

  Orbit3D.prototype.CreateParticle = function(jed) {
    var pos = this.getPosAtTime(jed);
    /*
    var geometry= new THREE.SphereGeometry(this.opts.object_size);
    var material= new THREE.MeshBasicMaterial({color: this.opts.color});
    var particle = new THREE.Mesh(geometry, material);
    particle.position.set(pos[0], pos[1], pos[2]);
    */

    if (this.particle_geometry) {
      this.farticle = new THREE.Vector3(
        pos[0], pos[1], pos[2]
      );
      // add it to the geometry
      this.vertex_pos = this.particle_geometry.vertices.length;
      this.particle_geometry.vertices.push(this.farticle);
    }

    //return particle;
  }

  Orbit3D.prototype.MoveParticle = function(time_jed) {
    var pos = this.getPosAtTime(time_jed);
    //this.particle.position.set(pos[0], pos[1], pos[2]);
    if (this.farticle) {
      var vertex_particle = this.particle_geometry.vertices[this.vertex_pos];
      vertex_particle.x = pos[0];
      vertex_particle.y = pos[1];
      vertex_particle.z = pos[2];
    }
  }

  Orbit3D.prototype.getPosAtTime = function(jed) {
    if (jed in this.pos_cache) {
      return this.pos_cache[jed];
    }

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

    var sin = Math.sin, cos = Math.cos;
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
    var ret = [X, Y, Z];
    this.pos_cache[jed] = ret;
    return ret;
  }

  Orbit3D.prototype.getEllipse = function() {
    if (!this.ellipse)
      this.ellipse = this.CreateOrbit(this.opts.jed);
    return this.ellipse;
  }

  Orbit3D.prototype.getParticle = function() {
    return this.particle;
  }

  window.Orbit3D = Orbit3D;
})();
