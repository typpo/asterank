(function() {
  var pi = Math.PI;
  var PIXELS_PER_AU = 50;

  var Orbit3D = function(eph, opts, scene) {
    opts = opts || {};
    opts.color = opts.color || 0xffee00;
    opts.width = opts.width || 1;
    opts.object_size = opts.object_size || 3;

    this.opts = opts;
    this.eph = eph;
    this.CreateOrbit();
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

    var ecurve = new THREE.EllipseCurve(0, 0, rx, ry, 0, 2*pi, true);

    var shape = new THREE.Shape();
    shape.fromPoints(ecurve.getPoints(100));

    var points = shape.createPointsGeometry();
    var line = new THREE.Line(points,
      new THREE.LineBasicMaterial({color: this.opts.color, linewidth: this.opts.width}));
    //line.position.set(0,0,0);
    line.position.x = -rf;
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
    dummy.rotation.y = (this.eph.i - Ephemeris.earth.i) * pi / 180;
    dummy.rotation.z = this.eph.w * pi / 180;

    this.object3D = dummy;
  }

  Orbit3D.prototype.CreateParticle = function() {
    // http://www.davidcolarusso.com/astro/
    // http://www.stargazing.net/kepler/ellipse.html#twig02a

    console.log(this.eph.full_name);
    //var M = this.eph.M;
    var e = this.eph.e;
    var a = this.eph.a;
    var i = (this.eph.i-Ephemeris.earth.i) * pi/180;
    var o = this.eph.om * pi/180; // longitude of ascending node
    var p = this.eph.w * pi/180; // longitude of perihelion
    var L = this.eph.L * pi/180; // mean longitude
    var ma = this.eph.ma;
    var M;
    if (ma) {
      // Calculate mean anomaly at J2000
      ma *= pi/180;
      var n = this.eph.n * pi/180; // mean motion
      var epoch = this.eph.epoch;
      console.log(this.eph);
      var d = this.eph.epoch - 2451545.0; // 2000 Jan 1.5
      M =  ma + n * d;
    }
    else {
      // Assume that date of elements is J2000
      M = L - p;
    }
    //M = (M + pi) / 2*pi;
    //M = (M - Math.floor(M)) * 2*pi - pi; // modulo pi
    M = M % pi;
    console.log('M:', M*180/pi);

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

    var x = X;
    var y = Y //Y * cos(i) - Z * sin(i);
    var z = Z //Y * sin(i) + Z * cos(i);

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
