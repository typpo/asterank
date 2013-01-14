(function() {
  "use strict";

  var pi = Math.PI;
  var PIXELS_PER_AU = 50;
  var USE_REAL_ELLIPSE = true;

  var attributes
  var uniforms;

  var Orbit3D = function(eph, opts, bigParticle) {
    opts = opts || {};
    opts.color = opts.color || 0xffee00;
    opts.width = opts.width || 1;
    opts.object_size = opts.object_size || 1;
    opts.jed =  opts.jed || 2451545.0;

    this.opts = opts;
    this.eph = eph;
    this.particle_geometry = opts.particle_geometry;
    this.bigParticle = bigParticle;

    this.CreateParticle(opts.jed, opts.texture_path);
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
    for (var i=0; i <= parts; i++, time+=delta) {
      var pos = this.getPosAtTime(time);
      var vector = new THREE.Vector3(pos[0], pos[1], pos[2]);
      prev = vector;
      pts.push(vector);
    }

    points = new THREE.Geometry();
    points.vertices = pts;
    points.computeLineDistances(); // required for dotted lines

    var line = new THREE.Line(points,
      new THREE.LineDashedMaterial({
        color: this.opts.color,
        linewidth: this.opts.width,
        dashSize: 1,
        gapSize: 0.5
      }), THREE.LineStrip);
    return line;
  }

  Orbit3D.prototype.CreateParticle = function(jed, texture_path) {
    if (!this.bigParticle && this.particle_geometry) {
      // dummy position for particle geometry
      var tmp_vec = new THREE.Vector3(0,0,0);
      this.particle_geometry.vertices.push(tmp_vec);
      return;
    }

    // this is used by broken canvas mode only

    var pos = this.getPosAtTime(jed);

    if (this.bigParticle) {
      //var obj = new THREE.Object3D();
      var geometry = new THREE.SphereGeometry(this.opts.object_size);
      //var geometry = new THREE.CubeGeometry(100, 100, 100);
      var mat_opts = {color: this.opts.color};
      if (texture_path) {
        $.extend(mat_opts, {
          map: THREE.ImageUtils.loadTexture(texture_path),
          wireframe: false,
          overdraw: true
        });
      }
      var material= new THREE.MeshBasicMaterial(mat_opts);
      this.particle = new THREE.Mesh(geometry, material);
      //this.particle.scale.x = -1; // flip so texture shows up oriented correctly
      this.particle.position.set(pos[0], pos[1], pos[2]);
    }
  }

  Orbit3D.prototype.MoveParticle = function(time_jed) {
    var pos = this.getPosAtTime(time_jed);
    this.MoveParticleToPosition(pos);
  }

  Orbit3D.prototype.MoveParticleToPosition = function(pos) {
    if (this.bigParticle) {
      this.particle.position.set(pos[0], pos[1], pos[2]);
    }
    else {
      var vertex_particle = this.particle_geometry.vertices[this.vertex_pos];
      vertex_particle.x = pos[0];
      vertex_particle.y = pos[1];
      vertex_particle.z = pos[2];
    }
  }

  Orbit3D.prototype.getPosAtTime2 = function(jed) {
    var sin = Math.sin, cos = Math.cos, sqrt = Math.sqrt;

    var ecc = this.eph.e;
    var w_arg_perihelion = this.eph.w - this.eph.om;

    // calculate eccentric anomaly
    var a = this.eph.a;
    var e = this.eph.e;
    var e_star = 180/pi * this.eph.e;
    var ma = this.eph.ma;   // MA at epoch
    var n;
    if (this.eph.n)
      n = this.eph.n; // mean motion
    else {
      n = 2*pi / this.eph.P * 180/pi;
    }
    var epoch = this.eph.epoch;
    var d = epoch - jed;
    var M = ma + n * d; // mean anomaly, in degrees
    //var M = this.eph.ma;  // mean anomaly, in degrees
    var E_n = M + e_star * sin(M);
    var diff = 1;
    var i =0;
    do {
      if (++i > 50) break;
      var delta_M = M - (E_n - e_star * sin(E_n));
      var delta_E = delta_M / (1 - e*cos(E_n));

      var E_n = E_n + delta_E;
      diff = delta_E;
    } while (diff < 1e-6);

    var E = E_n;

    var x1 = a * (cos(E) - e);
    var y1 = a * sqrt(1 - e*e) * sin(E);
    var z1 = 0;

    var w = w_arg_perihelion * pi/180;
    var i = this.eph.i * pi/180;
    var om = this.eph.om * pi / 180;
    var X = (cos(w) * cos(om) - sin(w) * sin(om) * cos(i)) * x1
          + (-sin(w) * cos(om) - cos(w) * sin(om) * cos(i)) * y1;
    var Y = (cos(w) * sin(om) + sin(w) * cos(om) * cos(i)) * x1
          + (-sin(w) * sin(om) + cos(w) * cos(om) * cos(i)) * y1;
    var Z = (sin(w) * sin(i)) * x1
          + (cos(w) * sin(i)) * y1;

    var ret = [X*PIXELS_PER_AU, Y*PIXELS_PER_AU, Z*PIXELS_PER_AU];
    return ret;
  }

  Orbit3D.prototype.getPosAtTime = function(jed) {
    // Note: this must match the vertex shader.
    // This position calculation is used to follow asteroids in 'lock-on' mode
    var e = this.eph.e;
    var a = this.eph.a;
    var i = (this.eph.i-Ephemeris.earth.i) * pi/180;
    var o = (this.eph.om) * pi/180; // longitude of ascending node
    var p = this.eph.w_bar * pi/180; // LONGITUDE of perihelion
    var ma = this.eph.ma;
    var M;
    // Calculate mean anomaly at jed
    ma = ma * pi/180;
    var n;
    if (this.eph.n)
      n = this.eph.n * pi/180; // mean motion
      //n = 17.0436 / sqrt(a*a*a);
    else {
      n = 2*pi / this.eph.P;
    }
    var epoch = this.eph.epoch;
    var d = jed - epoch;
    M = ma + n * d;

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
