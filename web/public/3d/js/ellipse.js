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
        gapSize: 0.5,
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

  Orbit3D.prototype.getPosAtTime = function(jed) {
    // Note: this must match the vertex shader.
    // This position calculation is used to follow asteroids in 'lock-on' mode
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

// Data from NASA, eg.
// http://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html

(function() {
  var eph = {
    mercury: {
      full_name: 'Mercury',
      ma: 174.79439,
      epoch: 2451545.0,
      a: 0.38709893,
      e: 0.20563069,
      i: 7.00487,
      w: 77.45645,
      L: 252.25084,
      om: 48.33167,
      P: 87.969
    },
    venus: {
      full_name: 'Venus',
      ma: 50.37663231999999,
      epoch: 2451545.0,
      a:0.72333566,
      e:0.00677672,
      i:3.39467605,
      w:131.60246718,
      L:181.97909950,
      om:76.67984255,
      P: 224.701
    },
    earth: {
      full_name: 'Earth',
      ma: -2.4731102699999905,
      epoch: 2451545.0,
      a:1.00000261,
      e:0.01671123,
      i:-0.00001531,
      w:102.93768193,
      L:100.46457166,
      //om:-11.26064,
      om: 0,
      P: 365.256
    },
    mars:{
      full_name: 'Mars',
      ma: 19.412479999999945,
      epoch: 2451545.0,
      a: 1.52366231,
      e: 0.09341233,
      i: 1.85061,
      w: 336.04084,
      L:355.45332,
      om:49.57854,
      P: 686.980
    },
    jupiter: {
      full_name: 'Jupiter',
      ma: 19.66796068,
      epoch: 2451545.0,
      a:5.20288700,
      e:0.04838624,
      i:1.30439695,
      w:14.72847983,
      L:34.39644051,
      om:100.47390909,
      P: 4332.589
    },
  };
  window.Ephemeris = eph;
})();
