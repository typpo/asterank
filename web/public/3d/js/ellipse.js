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
    this.object3D = this.CreateOrbit(true);
    this.object3D_fuzzy = this.CreateOrbit(false);
    this.CreateParticle();
  }

  Orbit3D.prototype.CreateOrbit = function(using_real_ellipse) {
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
    //var using_real_ellipse = true//this.eph.P;
    if (using_real_ellipse) { // draw ellipse ourselves
      var ecurve = new THREE.EllipseCurve(0, 0, rx, ry, 0, 2*pi, true);
      pts = (ecurve.getPoints(100));
      shape.fromPoints(ecurve.getPoints(100));
      points = shape.createPointsGeometry();
    }
    else {
      var time = 2451545.0
      var pts = []
      var limit = this.eph.P ? this.eph.P+1 : this.eph.per;
      var delta = 5;
      var record = {};
      var consechits = 0;
      var n = 0;
      for (var i=0; i < limit; i++, time+=delta) {
        // months
        var pos = this.getPosAtTime(time);
        var key = this.getPositionKey(pos);
        if (key in record) {
          if (consechits++ > 2) {
            console.log(key);
            break;
          }
          consechits = 0;
        }
        var vector = new THREE.Vector3(pos[0], pos[1], pos[2]);
        vector.multiplyScalar(PIXELS_PER_AU);
        pts.push(vector);
        record[key] = true;
        n++;
      }
      //shape.fromPoints(pts);
      console.log(n);
      points = new THREE.Geometry();
      points.vertices = pts;
      points.mergeVertices();
      console.log(points);
    }

    var line = new THREE.Line(points,
      new THREE.LineBasicMaterial({color: this.opts.color, linewidth: this.opts.width}));
    if (using_real_ellipse) {
      line.position.x = rf;
      line.position.y = 0;
      line.position.z = 0;

      //line.rotation.x = pi/2;
      //line.rotation.y = (this.eph.i * pi / 180) - (Ephemeris.earth.i * pi/180);
      //line.rotation.z = this.eph.w * pi / 180;
      //rotateAroundWorldAxis(line, new THREE.Vector3(0, 1, 0), (this.eph.i * pi / 180) - (Ephemeris.earth.i * pi/180));
      //rotateAroundWorldAxis(line, new THREE.Vector3(0, 0, 1), this.eph.w * pi/180);

      // dummy for rotating around 0,0,0 even though we've moved the object
      var dummy = new THREE.Object3D();
      dummy.add(line);
      dummy.rotation.x = 0//-pi;
      dummy.rotation.y = (this.eph.i - Ephemeris.earth.i) * pi / 180;
      //dummy.rotation.z = -(this.eph.w * pi / 180 + pi);
      dummy.rotation.z = (this.eph.w * pi / 180);
      //dummy.position.y += rf;
      //this.object3D = dummy;
      return dummy;
    }
    else {
      //this.object3D = line;
      return line;
    }
  }

  Orbit3D.prototype.CreateParticle = function() {
    // http://www.davidcolarusso.com/astro/
    // http://www.stargazing.net/kepler/ellipse.html#twig02a
    // http://www.stjarnhimlen.se/comp/ppcomp.html

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
    var geometry= new THREE.SphereGeometry(this.opts.object_size);
    var material= new THREE.MeshBasicMaterial({color: this.opts.color});
    var particle = new THREE.Mesh(geometry, material);
    var pos = this.getPosAtTime();  // position at epoch
    particle.position.x = pos[0];
    particle.position.y = pos[1];
    particle.position.z = pos[2];
    particle.position.multiplyScalar(PIXELS_PER_AU);

    /*
    particle.rotation.x = pi/2;
    particle.rotation.z = this.eph.w * pi / 180;
    particle.rotation.y = this.eph.i * pi / 180;
    */

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
    //if (ma) {
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
      /*
    }
    else {
      // Assume that date of elements is J2000, and that we are given
      // mean longitude.
      var L = this.eph.L * pi/180; // mean longitude
      M = L - p;
    }
    */
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

    /*
    var v;
    var E = M + e * sin(M) * (1 + e*cos(M));
    var E0;
    var c = 0;
    do {
      E0 = E;
      E = (E0 - e * sin(E0) - M) / (1 - e * cos(E0));
      c++;
    } while (Math.abs(E - E0) > 1 && c < 100000);

    v = 2 * Math.atan(Math.sqrt((1+e)/(1-e)) * Math.tan(E/2));
    */

    // radius vector, in AU
    var r = a * (1 - e*e) / (1 + e * cos(v));

    // heliocentric coords
    var X = r * (cos(o) * cos(v + p - o) - sin(o) * sin(v + p - o) * cos(i))
    var Y = r * (sin(o) * cos(v + p - o) + cos(o) * sin(v + p - o) * cos(i))
    var Z = r * (sin(v + p - o) * sin(i))

    var x = X;
    var y = Y//Y * cos(i) - Z * sin(i);
    var z = Z//Y * sin(i) + Z * cos(i);

    /*
    x = Math.round(x*100)/100;
    y = Math.round(y*100)/100;
    z = Math.round(z*100)/100;
    */

    return [x, y, z];
  }

  Orbit3D.prototype.getObject = function() {
    return this.object3D;
  }

  Orbit3D.prototype.getObjectFuzzy = function() {
    return this.object3D_fuzzy;
  }

  Orbit3D.prototype.getParticle = function() {
    return this.particle;
  }

  Orbit3D.prototype.getPositionKey = function(pos) {
    var x = Math.round(pos[0]*100)/100;
    var y = Math.round(pos[1]*100)/100;
    var z = Math.round(pos[2]*100)/100;
    var key = x + '_' + y + '_' + z;
    return key;
  }

  window.Orbit3D = Orbit3D;
})();

// Rotate an object around an axis in object space
function rotateAroundObjectAxis( object, axis, radians ) {
  var rotationMatrix = new THREE.Matrix4();
  console.log(rotationMatrix);
  rotationMatrix.setRotationAxis( axis.normalize(), radians );
  object.matrix.multiplySelf( rotationMatrix );                       // post-multiply
  object.rotation.setRotationFromMatrix( object.matrix );
}

// Rotate an object around an axis in world space (the axis passes through the object's position)
function rotateAroundWorldAxis( object, axis, radians ) {
  var rotationMatrix = new THREE.Matrix4();
  rotationMatrix.rotateByAxis( axis.normalize(), radians );
  rotationMatrix.multiplySelf( object.matrix );                       // pre-multiply
  object.matrix = rotationMatrix;
console.log(object.rotation);
  object.rotation.setEulerFromRotationMatrix( object.matrix );
}
