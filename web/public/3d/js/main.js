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
  var MAX_NUM_ORBITS = 1;
  var stats, scene, renderer, composer;
  var camera, cameraControls;
  var pi = Math.PI;
  var rendered_asteroids = [];
  var mouse = { x: 0, y: 0 }, mouseonce = false;
  var projector, INTERSECTED;

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
    camera.position.y = 100;

    window.cam = camera;
    //THREE.Object3D._threexDomEvent.camera(camera);    // camera mouse handler

    scene.add(camera);

    cameraControls	= new THREE.TrackballControls(camera)
    cameraControls.staticMoving = true;

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
    scene.add(new Orbit3D(Ephemeris.mercury, {color: 0x913CEE, width: 3}).getObject());
    scene.add(new Orbit3D(Ephemeris.venus, {color: 0xFF7733, width: 3}).getObject());
    scene.add(new Orbit3D(Ephemeris.earth, {color: 0x009ACD, width: 3}).getObject());
    scene.add(new Orbit3D(Ephemeris.mars, {color: 0xA63A3A, width: 3}).getObject());
    scene.add(new Orbit3D(Ephemeris.jupiter, {color: 0xFF7F50, width: 3}).getObject());
    runQuery();

    // Sky
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

    projector = new THREE.Projector();
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  }

  function onDocumentMouseMove(event) {
    mouseonce = true;
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  }

  // animation loop
  function animate() {
    requestAnimationFrame(animate);
    render();
    update();
  }

  function update() {
    stats.update();

    // find intersections
    if (!mouseonce) return;

    // create a Ray with origin at the mouse position
    //   and direction into the scene (camera direction)
    var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
    projector.unprojectVector( vector, camera );
    var ray = new THREE.Ray( camera.position, vector.subSelf( camera.position ).normalize() );

    // create an array containing all objects in the scene with which the ray intersects
    var intersects = ray.intersectObjects( scene.children );

    // INTERSECTED = the object in the scene currently closest to the camera
    //    and intersected by the Ray projected from the mouse position

    // if there is one (or more) intersections
    if ( intersects.length > 0 )
    {
      // if the closest object intersected is not the currently stored intersection object
      if ( intersects[ 0 ].object != INTERSECTED )
      {
        // restore previous intersection object (if it exists) to its original color
        if ( INTERSECTED )
          INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
        // store reference to closest object as current intersection object
        INTERSECTED = intersects[ 0 ].object;
        // store color of closest object (for later restoration)
        INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
        // set a new color for closest object
        INTERSECTED.material.color.setHex( 0xffff00 );
      }
      console.log('intersected');
    }
    else // there are no intersections
    {
      // restore previous intersection object (if it exists) to its original color
      if ( INTERSECTED )
        INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
      // remove previous intersection object reference
      //     by setting current intersection object to "nothing"
      INTERSECTED = null;
    }


    /*
    if ( keyboard.pressed("z") )
    {
      // do something
    }
    */
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
        var eph = {
          a: roid.a,
          e: roid.e,
          w: roid.w,
          i: roid.i
        };
        //console.log(scene);
        var orbit = new Orbit3D(eph, null, scene);
        //console.log(orbit.getPlane());
        /*
        orbit.getPlane().addEventListener('mouseover', function(e) {
          console.log('adddqw3');
          $('#info .top').html(roid.full_name);
        });
        */
        rendered_asteroids.push(orbit);
        scene.add(orbit.getObject());
        scene.add(orbit.getPlane());
      }
    });
  }
})();
