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
    this.createParticle();
  }

  Orbit3D.prototype.createOrbit = function() {
    this.eph.b = this.eph.a * Math.sqrt(1 - eph.e * eph.e);
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

  Orbit3D.prototype.createParticle = function() {

    var w=eph.w-eph.O;
    var M=eph.L-eph.w;
    var I=eph.I;
    var m=(M+pi)/(2*pi);
    M=(m-Math.floor(m))*2*pi-pi;

    var E=M;
    E=M+eph.e*Math.sin(E);
    var x=eph.a*(Math.cos(E)-eph.e);
    var y=eph.a*Math.sqrt(1-eph.e*eph.e)*Math.sin(E);
    var sO=Math.sin(eph.O);
    var cO=Math.cos(eph.O);
    var sw=Math.sin(w);
    var cw=Math.cos(w);
    var cc=cw*cO;
    var ss=sw*sO;
    var sc=sw*cO;
    var cs=cw*sO;
    var ci=Math.cos(I);
    var si=Math.sin(I);
    var X=(cc-ss*ci)*x+(-sc-cs*ci)*y;
    var Y=(cs+sc*ci)*x+(-ss+cc*ci)*y;
    var Z=(Math.sin(w)*si)*x+(Math.cos(w)*si)*y;

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
    particle.position.x = rx;
    particle.position.y = ry;
    particle.position.z = 1;
    particle.rotation.x = pi/2;
    particle.rotation.z = eph.w * pi / 180;
    particle.rotation.y = eph.i * pi / 180;

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
