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
  var MAX_NUM_ORBITS = 25;
  var stats, scene, renderer, composer;
  var camera, cameraControls;
  var pi = Math.PI;
  var rendered_asteroids = [];

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
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.z = 100;
    //camera.position.y = 100;

    window.cam = camera;
    THREE.Object3D._threexDomEvent.camera(camera);    // camera mouse handler

    scene.add(camera);

    cameraControls	= new THREE.TrackballControls(camera)
    cameraControls.staticMoving = true;
    cameraControls.panSpeed = 2;
    cameraControls.zoomSpeed = 3;

    // Rendering stuff
    var PI2 = Math.PI * 2;

    (function() {
      var material = new THREE.ParticleCanvasMaterial({
        color: 0xffee00,
        program: function (context) {
          context.beginPath();
          context.arc(0, 0, 1, 0, PI2, true);
          context.closePath();
          context.fill();
        }
      });

      var geometry = new THREE.Geometry();

      for (var i = 0; i < 100; i++) {
        var particle = new THREE.Particle(material);
        particle.position.x = Math.random() * 2 - 1;
        particle.position.y = Math.random() * 2 - 1;
        particle.position.z = Math.random() * 2 - 1;
        particle.position.normalize();
        particle.position.multiplyScalar(Math.random() * 450);
        //particle.scale.x = particle.scale.y = 1;
        scene.add(particle);

        geometry.vertices.push(particle.position);
      }
    });

    // "sun" - 0,0 marker
    (function() {
      var geometry= new THREE.SphereGeometry(1);
      var material= new THREE.MeshLambertMaterial({color: 0xffee00});
      var mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
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

    // ycibndzchg3
    var mercury = new Orbit3D(Ephemeris.mercury, {color: 0x913CEE, width: 3});
    scene.add(mercury.getObject());
    scene.add(mercury.getParticle());
    var venus = new Orbit3D(Ephemeris.venus, {color: 0xFF7733, width: 3});
    scene.add(venus.getObject());
    scene.add(venus.getParticle());
    var earth = new Orbit3D(Ephemeris.earth, {color: 0x009ACD, width: 3});
    scene.add(earth.getObject());
    scene.add(earth.getParticle());
    var mars = new Orbit3D(Ephemeris.mars, {color: 0xA63A3A, width: 3});
    scene.add(mars.getObject());
    scene.add(mars.getParticle());
    var jupiter = new Orbit3D(Ephemeris.jupiter, {color: 0xFF7F50, width: 3});
    scene.add(jupiter.getObject());
    scene.add(jupiter.getParticle());
    runQuery();

    // Sky
    /*
    var materialArray = [];
    materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
    var skyboxGeom = new THREE.CubeGeometry(9000, 9000, 9000, 1, 1, 1, materialArray);
    var skybox = new THREE.Mesh( skyboxGeom, new THREE.MeshFaceMaterial() );
    skybox.flipSided = true;
    //scene.add(skybox);
    */
  }

  // animation loop
  function animate() {
    requestAnimationFrame(animate);
    render();
    update();
  }

  function update() {
    stats.update();
  }

  // render the scene
  function render() {
    // update camera controls
    cameraControls.update(1.5);
    // actually render the scene
    renderer.render(scene, camera);
  }

  function runQuery(sort) {
    sort = sort || 'score';
    for (var i=0; i < rendered_asteroids.length; i++) {
      scene.remove(rendered_asteroids[i].getObject());
    }
    $.getJSON('/top?sort=' + sort + '&n=100', function(data) {
      for (var i=0; i < data.results.rankings.length && i < MAX_NUM_ORBITS; i++) {
        var roid = data.results.rankings[i];
        console.log(roid);
        var orbit = new Orbit3D(roid, {
          color: 0xffffff,
          object_size:1
        }, scene);
        (function(roid, orbit) {
          orbit.getParticle().on('mouseover', function(e) {
            scene.add(orbit.getObject());
            $('#info .top').html(roid.full_name);
          });
          orbit.getParticle().on('mouseout', function(e) {
            scene.remove(orbit.getObject());
            $('#info .top').html('');
          });
        })(roid, orbit);
        rendered_asteroids.push(orbit);
        //scene.add(orbit.getObject());
        scene.add(orbit.getParticle());
      }
    });
  }
})();
