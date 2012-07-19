(function() {
  "use strict";

  window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function( callback ){
              window.setTimeout(callback, 1000 / 60);
            };
  })();

  var WEB_GL_ENABLED = false;
  var stats, scene, renderer, composer;
  var camera, cameraControls;
  var pi = Math.PI;

  if(!init())	animate();

  // init the scene
  function init(){
    if(WEB_GL_ENABLED && Detector.webgl){
      renderer = new THREE.WebGLRenderer({
        antialias		: true,	// to get smoother output
        preserveDrawingBuffer	: true	// to allow screenshot
      });
      renderer.setClearColorHex(0xBBBBBB, 1);
    }
    else{
      renderer	= new THREE.CanvasRenderer();
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    // Set up stats
    stats = new Stats();
    stats.domElement.style.position	= 'absolute';
    stats.domElement.style.bottom	= '0px';
    document.body.appendChild(stats.domElement);

    // create a scene
    scene = new THREE.Scene();

    // put a camera in the scene
    var cameraH	= 3;
    var cameraW	= cameraH / window.innerHeight * window.innerWidth;
    //camera	= new THREE.OrthographicCamera(-cameraW/2, +cameraW/2, cameraH/2, -cameraH/2, 1, 10000);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 100;

    window.cam = camera;
    scene.add(camera);

    cameraControls	= new THREE.TrackballControls(camera)
    cameraControls.staticMoving = true;

    // Rendering stuff
    var PI2 = Math.PI * 2;

    (function() {
      var material = new THREE.ParticleCanvasMaterial({
        color: 0x000000,
        program: function (context) {
          context.beginPath();
          context.arc(0, 0, 1, 0, PI2, true);
          context.closePath();
          context.fill();
        }
      });

      var geometry = new THREE.Geometry();

      for (var i = 0; i < 100; i++) {
        particle = new THREE.Particle(material);
        particle.position.x = Math.random() * 2 - 1;
        particle.position.y = Math.random() * 2 - 1;
        particle.position.z = Math.random() * 2 - 1;
        particle.position.normalize();
        particle.position.multiplyScalar(Math.random() * 450);
        particle.scale.x = particle.scale.y = 1;
        scene.add(particle);

        geometry.vertices.push(particle.position);
      }
    });

    // "sun" - 0,0 marker
    (function() {
      var geometry= new THREE.SphereGeometry(1);
      var material= new THREE.MeshNormalMaterial();
      var mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // sun plane
      /*
      var plane = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshBasicMaterial({
        color: 0x0000ff
      }));
      plane.position.set(0,0,0);
      plane.overdraw = true;
      scene.add(plane);
      */
    })();

    function axes() {
      var  cylinder = new THREE.CylinderGeometry(30, .5, .5, 200);

      var xMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      var yMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      var zMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });

      var xMesh     = new THREE.Mesh(cylinder, xMaterial);
      var yMesh     = new THREE.Mesh(cylinder, yMaterial);
      var zMesh     = new THREE.Mesh(cylinder, zMaterial);

      //xMesh.rotation.y = Math.PI / 2;
      //xMesh.position.x = 100;

      //yMesh.rotation.x = Math.PI / 2;
      //yMesh.position.y = 100;

      //zMesh.position.z = 100;

      //scene.add(xMesh);
      //scene.add(yMesh);
      scene.add(zMesh);
    }
    //axes();

    // Ellipses

    /*
    function addGeometry(points, color, x, y, z, rx, ry, rz, s) {
      var line = new THREE.Line( points, new THREE.LineBasicMaterial( { color: color, linewidth: 2 } ) );
      line.position.set( x, y, z);

      // from 0,0,100:
      // view head on from above (Math.PI, Math.PI / 4, 0)
      // view from side, vertically (Math.PI * 2, Math.PI / 4, 0)
      //line.rotation.set( rx, ry, rz );
      line.rotation.x = pi/2;
      // TODO rotate with respect to window, not camera: https://github.com/mrdoob/three.js/issues/910

      line.scale.set( s, s, s );
      scene.add( line );
    }

    // ellipse!
    (function() {
      //var shape = new THREE.Shape();
      //drawEllipse(shape, 0, 0, 100, 200);

      var ecurve = new THREE.EllipseCurve(0, 0, 50, 80, 0, 2 * Math.PI, true);

      var shape = new THREE.Shape();
      shape.fromPoints(ecurve.getPoints(100));

      var shapePoints = shape.createPointsGeometry();
      addGeometry(shapePoints, 0xffee00, 0,0,0, 0,0,0, 1);
    })();
    */

    // ycibndzchg3
    scene.add(new Orbit3D(Ephemeris.mercury).getObject());
    scene.add(new Orbit3D(Ephemeris.venus).getObject());
    scene.add(new Orbit3D(Ephemeris.mars).getObject());
    scene.add(new Orbit3D(Ephemeris.earth).getObject());
    scene.add(new Orbit3D(Ephemeris.jupiter).getObject());
  }

  // animation loop
  function animate() {
    // loop on request animation loop
    // - it has to be at the begining of the function
    // - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
    requestAnimationFrame(animate);

    // do the render
    render();

    // update stats
    stats.update();
  }

  // render the scene
  function render() {
    // update camera controls
    cameraControls.update(1.5);
    // actually render the scene
    renderer.render(scene, camera);
  }
})();
