(function() {
  var pi = Math.PI;
  var PIXELS_PER_AU = 50;

  var Orbit3D = function(eph, opts, scene) {
    opts = opts || {};
    opts.color = opts.color || 0xffee00;
    opts.width = opts.width || 1;

    eph.b = eph.a * Math.sqrt(1 - eph.e * eph.e);
    var rx = eph.a * PIXELS_PER_AU;
    var ry = eph.b * PIXELS_PER_AU;

    var ecurve = new THREE.EllipseCurve(0, 0, rx, ry, 0, 2*pi, true);

    var shape = new THREE.Shape();
    shape.fromPoints(ecurve.getPoints(100));

    var points = shape.createPointsGeometry();
    var line = new THREE.Line(points,
      new THREE.LineBasicMaterial({color: opts.color, linewidth: opts.width}));
    line.position.set(0,0,0);

    // Mesh at the same plane as the orbit for detecting mouseover
    /*
    var orbit_cylinder = new THREE.CylinderGeometry(eph.a*PIXELS_PER_AU, .5, .5, 200);
    var orbit_mesh = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    var orbit_plane = new THREE.Mesh(orbit_cylinder, orbit_mesh);
    orbit_plane.visible = false;
    */
    var extrusionSettings = {
      size: 1, height: 1, curveSegments: 3,
      bevelThickness: 1, bevelSize: 1, bevelEnabled: false,
      material: 0, extrudeMaterial: 1,
      amount: 0.2,
    };
    var extruded = shape.extrude(extrusionSettings);//new THREE.ExtrudeGeometry(shape, extrudeSettings);
    /*
    var orbit_plane = THREE.SceneUtils.createMultiMaterialObject(extruded, [
      new THREE.MeshLambertMaterial({ color: 0xffee00 }),
      new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true })
    ]);
    */
    var orbit_plane = new THREE.Mesh(extruded, new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true }));

    orbit_plane.rotation.x = line.rotation.x = pi/2;
    orbit_plane.rotation.z = line.rotation.z = eph.w * pi / 180;
    orbit_plane.rotation.y = line.rotation.y = eph.i * pi / 180;
    orbit_plane.visible = false;
    //if (scene) scene.add(orbit_plane);
    // rotate with respect to window, not camera: https://github.com/mrdoob/three.js/issues/910
    this.object3D = line;
    this.plane = orbit_plane;
  }

  Orbit3D.prototype.getObject = function() {
    return this.object3D;
  }

  Orbit3D.prototype.getPlane = function() {
    return this.plane;
  }

  window.Orbit3D = Orbit3D;
})();
