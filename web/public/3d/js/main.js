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


  var WEB_GL_ENABLED = true;
  var MAX_NUM_ORBITS = 3000;
  var PIXELS_PER_AU = 50;
  var NUM_BIG_PARTICLES = 20;   // show this many asteroids with orbits
  var stats, scene, renderer, composer;
  var camera, cameraControls;
  var pi = Math.PI;
  var using_webgl = false;
  var camera_fly_around = true;
  var object_movement_on = true;
  var lastHovered;
  var added_objects = [];
  var planets = [];
  var planet_orbits_visible = true;
  var jed = 2451545.0;  // 1/1/00
  var particle_system_geometry = null;
  var asteroids_loaded = false;
  var display_date_last_updated = 0;

  // workers stuff
  var works = [];
  var workers = [];
  var NUM_WORKERS = 3;
  var worker_path = '/3d/js/position_worker.js';
  var workers_initialized = false;
  //var position_results_queue = [];
  var particleSystem;

  // glsl stuff
  var attributes;
  var uniforms;
  var psg_vertex_offset;

  init();
  initGUI();

  $('#btn-toggle-movement').on('click', function() {
    object_movement_on = !object_movement_on;
  });
  $('#controls .js-sort').on('click', function() {
    runAsteroidQuery($(this).data('sort'));
    $('#controls .js-sort').css('font-weight', 'normal');
    $(this).css('font-weight', 'bold');
  });

  function initGUI() {
    var ViewUI = function() {
      this['Cost effective'] = function() {
        runAsteroidQuery('score');
      };
      this['Most valuable'] = function() {
        runAsteroidQuery('price');
      };
      this['Most accessible'] = function() {
        runAsteroidQuery('closeness');
      };
      this.movement = object_movement_on;
      this['planet orbits'] = planet_orbits_visible;
      // TODO have this update with the simulation!
      this['display date'] = '12/26/2012';
    };

    window.onload = function() {
      var text = new ViewUI();
      var gui = new dat.GUI();
      gui.add(text, 'Cost effective');
      gui.add(text, 'Most valuable');
      gui.add(text, 'Most accessible');
      gui.add(text, 'movement').onChange(function() {
        object_movement_on = !object_movement_on;
        toggleSimulation(object_movement_on);
      });
      gui.add(text, 'planet orbits').onChange(function() {
        togglePlanetOrbits();
      });
      gui.add(text, 'display date').onChange(function(val) {
        // TODO don't do anything unless it changed
        var newdate = Date.parse(val);
        if (newdate) {
          var newjed = toJED(newdate);
          changeJED(newjed);
        }
      }).listen();
      window.datgui = text;
    }; // end window onload
  }

  function togglePlanetOrbits() {
    if (planet_orbits_visible) {
      for (var i=0; i < planets.length; i++) {
        scene.remove(planets[i].getEllipse());
      }
    }
    else {
      for (var i=0; i < planets.length; i++) {
        scene.add(planets[i].getEllipse());
      }
    }
    planet_orbits_visible = !planet_orbits_visible;
  }

  // init the scene
  function init(){
    if (WEB_GL_ENABLED && Detector.webgl){
      renderer = new THREE.WebGLRenderer({
        antialias		: true,	// to get smoother output
        //preserveDrawingBuffer	: true	// to allow screenshot
      });
      renderer.setClearColorHex(0x000000, 1);
      using_webgl = true;
    }
    else {
      renderer	= new THREE.CanvasRenderer();
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    // Set up stats
    /*
    stats = new Stats();
    stats.domElement.style.position	= 'absolute';
    stats.domElement.style.bottom	= '0px';
    document.body.appendChild(stats.domElement);
    */

    // create a scene
    scene = new THREE.Scene();

    // put a camera in the scene
    var cameraH	= 3;
    var cameraW	= cameraH / window.innerHeight * window.innerWidth;
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(0, -155, 32);
    //camera.position.set(22.39102192510384, -124.78460848134833, -55.29382439584528);
    //camera.position.set(12.39102192510384, -124.78460848134833, -75.29382439584528);

    //camera.position.set(-145, 41, -31);
    // 77, -155, 23

    window.cam = camera;
    THREE.Object3D._threexDomEvent.camera(camera);    // camera mouse handler
    THREEx.WindowResize(renderer, camera);    // handle window resize

    scene.add(camera);

    cameraControls	= new THREE.TrackballControlsX(camera)
    cameraControls.staticMoving = true;
    cameraControls.panSpeed = 2;
    cameraControls.zoomSpeed = 3;
    cameraControls.maxDistance = 1100;

    // Rendering stuff

    // "sun" - 0,0 marker
    if (using_webgl) {
      var sun = new THREE.Object3D();
      var texture = THREE.ImageUtils.loadTexture("/images/sunsprite.png");
      var sprite = new THREE.Sprite({
        map: texture,
        blending: THREE.AdditiveBlending,
        useScreenCoordinates: false,
        color: 0xffffff
      });
      sprite.scale.x = 50;
      sprite.scale.y = 50;
      sprite.scale.z = 1;
      sprite.color.setHSV(1.0, 0.0, 1.0);
      sun.add(sprite);
      scene.add(sun);
    }
    else {
      var material = new THREE.ParticleBasicMaterial({
        map: new THREE.Texture( starTexture(0xfff2a1,1) ),
        blending: THREE.AdditiveBlending
      });
      var particle = new THREE.Particle(material);
      particle.isClickable = false;
      scene.add(particle);
    }

    /*
    var plane = new THREE.Mesh(new THREE.PlaneGeometry(75, 75), new THREE.MeshBasicMaterial({
        color: 0x0000ff
    }));
    plane.overdraw = true;
    plane.doubleSided = true;
    plane.rotation.x = pi/2;
    scene.add(plane);
    */

    // Ellipses
    runAsteroidQuery();
    var mercury = new Orbit3D(Ephemeris.mercury,
        {
          color: 0x913CEE, width: 1, jed: jed, object_size: 1.7,
          texture_path: '/images/texture-mercury.jpg'
        }, true);
    scene.add(mercury.getEllipse());
    scene.add(mercury.getParticle());
    var venus = new Orbit3D(Ephemeris.venus,
        {
          color: 0xFF7733, width: 1, jed: jed, object_size: 1.7,
          texture_path: '/images/texture-venus.jpg'
        }, true);
    scene.add(venus.getEllipse());
    scene.add(venus.getParticle());
    var earth = new Orbit3D(Ephemeris.earth,
        {
          color: 0x009ACD, width: 1, jed: jed, object_size: 1.7,
          texture_path: '/images/texture-earth.jpg'
        }, true);
    scene.add(earth.getEllipse());
    scene.add(earth.getParticle());
    var mars = new Orbit3D(Ephemeris.mars,
        {
          color: 0xA63A3A, width: 1, jed: jed, object_size: 1.7,
          texture_path: '/images/texture-mars.jpg'
        }, true);
    scene.add(mars.getEllipse());
    scene.add(mars.getParticle());
    var jupiter = new Orbit3D(Ephemeris.jupiter,
        {
          color: 0xFF7F50, width: 1, jed: jed, object_size: 1.7,
          texture_path: '/images/texture-jupiter.jpg'
        }, true);
    scene.add(jupiter.getEllipse());
    scene.add(jupiter.getParticle());

    planets = [mercury, venus, earth, mars, jupiter];

    // Sky
    if (using_webgl) {
/*
      var urls = [];
      for (var i=0 ; i<6; i++) {
        urls.push('/images/universe.jpg');
      }
*/
var path = "/images/dark-s_";
        var format = '.jpg';
        var urls = [
            path + 'px' + format, path + 'nx' + format,
            path + 'py' + format, path + 'ny' + format,
            path + 'pz' + format, path + 'nz' + format
          ];
        var reflectionCube = THREE.ImageUtils.loadTextureCube( urls );
        reflectionCube.format = THREE.RGBFormat;

        var shader = THREE.ShaderUtils.lib[ "cube" ];
        shader.uniforms[ "tCube" ].value = reflectionCube;

        var material = new THREE.ShaderMaterial( {
          fragmentShader: shader.fragmentShader,
          vertexShader: shader.vertexShader,
          uniforms: shader.uniforms,
          depthWrite: false,
          side: THREE.BackSide
        } ),

        mesh = new THREE.Mesh( new THREE.CubeGeometry( 5000, 5000, 5000 ), material );
scene.add(mesh);
/*


      var materialArray = [];
      materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
      materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
      materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
      materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
      materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
      materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/images/universe.jpg' ) }));
      var skyboxGeom = new THREE.CubeGeometry(5000, 5000, 5000, 1, 1, 1, materialArray);
      var skybox = new THREE.Mesh( skyboxGeom, new THREE.MeshFaceMaterial(materialArray) );
      skybox.flipSided = true;
      scene.add(skybox);
*/
    }

    $('#container').on('mousedown', function() {
      camera_fly_around = false;
    });

    window.renderer = renderer;
  }

  // animation loop
  function animate() {
    if (!asteroids_loaded) {
      render();
      requestAnimFrame(animate);
      return;
    }
    if (camera_fly_around) {
      var timer = 0.0001 * Date.now();
      cam.position.x = Math.sin(timer) * 10;
      //cam.position.y = Math.sin( timer ) * 100;
      cam.position.z = -100 + Math.cos(timer) * 20;
    }
    /*
    if (object_movement_on && workers_initialized) {
      for (var i=0; i < NUM_WORKERS; i++) {
        workers[i].postMessage({
          command: 'results'
        });
      }
    }
      */
    /*
    for (var j=0; j < position_results_queue.length; j++) {
      var partpos_tuple = position_results_queue[j];
      partpos_tuple[0].MoveParticleToPosition(partpos_tuple[1]);
    }
    particle_system_geometry.__dirtyVertices = true;
    */

    render();
    requestAnimFrame(animate);
  }

  // render the scene
  function render() {
    // update camera controls
    cameraControls.update();

    // update shader vals
    // TODO only need to do this loop when user changes JED
    /*
    for( var i = 0; i < particle_system_geometry.vertices.length; i++ ) {
      attributes.jed.value[i] = jed;
    }
    attributes.jed.needsUpdate = true; // important!
    */
    uniforms.jed.value = jed;
    jed += .25;

    // actually render the scene
    renderer.render(scene, camera);
  }

  function startSimulation() {
    if (!asteroids_loaded) {
      throw "couldn't start simulation: asteroids not loaded";
    }
    if (!workers_initialized) {
      throw "couldn't start simulation: simulation not initialized";
    }

    for (var i=0; i < workers.length; i++) {
      // trigger work
      var particles = works[i];
      var obj_ephs = [];
      for (var j=0; j < particles.length; j++) {
        obj_ephs.push(particles[j].eph);
      }
      workers[i].postMessage({
        command: 'start',
        particle_ephemeris: obj_ephs,
        start_jed: jed
      });
    }
  }

  function stopSimulation() {
    toggleSimulation(false);
  }

  function toggleSimulation(run) {
    for (var i=0; i < workers.length; i++) {
      workers[i].postMessage({
        command: 'toggle_simulation',
        val: run
      });
    }
  }

  function initSimulation() {
    // TODO fallback for unsupported webworkers
    var l = added_objects.length;
    var objects_per_worker = Math.ceil(l / NUM_WORKERS);
    var remainder = l % NUM_WORKERS;
    for (var i=0; i < NUM_WORKERS; i++) {
      workers[i] = new Worker(worker_path);
      var start = i*objects_per_worker;
      works[i] = added_objects.slice(start, Math.min(start + objects_per_worker, l));
    }

    $.each(works, function(idx) {
      var work = this;
      workers[idx].onmessage = function(e) {
        handleSimulationResults(e, work.slice());
      }
    });
    /*
    for (var i=0; i < NUM_WORKERS; i++) {
      (function() {
        workers[i].onmessage = function(e) {
          handleSimulationResults(e, works[i]);
        }
      })();
    }
    */
    workers_initialized = true;
  }

  function handleSimulationResults(e, particles) {
    var data = e.data;
    switch(data.type) {
      case 'result':
        // queue simulation results
        var positions = data.value.positions;

        for (var i=0; i < positions.length; i++) {
          //position_results_queue.push([particles[i], positions[i]])
          particles[i].MoveParticleToPosition(positions[i]);
        }
        particle_system_geometry.verticesNeedUpdate = true;

        if (typeof datgui !== 'undefined') {
          // update with date
          var now = new Date().getTime();
          if (now - display_date_last_updated > 500) {
            var georgian_date = fromJED(data.value.jed);
            datgui['display date'] = georgian_date.getMonth()+1 + "/"
              + georgian_date.getDate() + "/" + georgian_date.getFullYear();
            display_date_last_updated = now;
          }
        }

        /*
        var all_chunks = [];
        for (var i=0; i < positions.length; i++) {
          all_chunks.push([particles[i], positions[i]]);
        }
        */

        /*
        timedChunk(particles, positions, function(particle, position) {
          particle.MoveParticleToPosition(position);
        }, this, function() {
          particle_system_geometry.verticesNeedUpdate = true;
        });
        */
        break;
      case 'debug':
        console.log(data.value);
        break;
      default:
        console.log('Invalid data type', data.type);
    }
  }


  function runAsteroidQuery(sort) {
    sort = sort || 'score';
    $('#loading').show();

    // Remove any old setup
    for (var i=0; i < added_objects.length; i++) {
      scene.remove(added_objects[i].getParticle());
    }
    if (particleSystem) {
      scene.remove(particleSystem);
      particleSystem = null;
    }
    if (asteroids_loaded) {
      stopSimulation();
    }
    // TODO right now this can only happen once

    if (lastHovered) {
      scene.remove(lastHovered);
    }

    // Get new data points
    $.getJSON('/top?sort=' + sort + '&n=' + MAX_NUM_ORBITS + '&use3d=true', function(data) {
      if (!data.results) {
        alert('Sorry, something went wrong and the server failed to return data.');
        return;
      }
      var n = data.results.rankings.length;
      // add planets
      added_objects = planets.slice();
      particle_system_geometry = new THREE.Geometry();

      var useBigParticles = true;
      for (var i=0; i < n; i++) {
        if (i === NUM_BIG_PARTICLES) {
          if (!using_webgl) {
            // only show objects of interest if there's no particlesystem support
            break;
          }
          useBigParticles = false;
        }
        var roid = data.results.rankings[i];
        var orbit = new Orbit3D(roid, {
          color: 0xcccccc,
          width: 2,
          object_size: 1.5,
          jed: jed,
          particle_geometry: particle_system_geometry // will add itself to this geometry
        }, useBigParticles);
        if (useBigParticles) {
          // bind information/orbit mouseover
          (function(roid, orbit, i) {
            orbit.getParticle().on('mouseover', function(e) {
              if (lastHovered) scene.remove(lastHovered);
              lastHovered = orbit.getEllipse();
              // TODO hitting escape should cancel this
              scene.add(lastHovered);
              if (roid.price < 1e10) {
                $('#main-caption').html(roid.full_name + ' - no significant value');
              }
              else {
                $('#main-caption').html(roid.full_name
                      + ' - $' + roid.fuzzed_price + ' in potential value');
              }
              $('#other-caption').html('(ranked #' + (i+1) + ')');
            });
          })(roid, orbit, i);
          scene.add(orbit.getParticle());
        } // end bigParticle logic
        else {

        }
        added_objects.push(orbit);
      }

      if (using_webgl) {
        // build particlesystem
        /*
        var particle_system_material = new THREE.ParticleBasicMaterial({
          color: 0xffffff,
          size: 10,
          blending: THREE.AdditiveBlending,
          map: THREE.ImageUtils.loadTexture(
            "/images/cloud3.png"
          ),
          transparent: true,
          depthTest: false,
          vertexColor: true
        });
        */
        //particle_system_material.color.setHSV(0, .80, .70);


        // particle system SHADER material
        // attributes
        attributes = {
          alpha: { type: 'f', value: [] },
          a: { type: 'f', value: [] },
          e: { type: 'f', value: [] },
          i: { type: 'f', value: [] },
          o: { type: 'f', value: [] },
          p: { type: 'f', value: [] },
          ma: { type: 'f', value: [] },
          n: { type: 'f', value: [] },
          w: { type: 'f', value: [] },
          P: { type: 'f', value: [] },
          epoch: { type: 'f', value: [] }
        };

        // uniforms
        // https://github.com/mrdoob/three.js/wiki/Updates
        uniforms = {
          color: { type: "c", value: new THREE.Color( 0xff0000 ) },
          jed: { type: 'f', value: jed },
          earth_i: { type: "f", value: Ephemeris.earth.i },
          earth_om: { type: "f", value: Ephemeris.earth.om },
          small_roid_texture:
            { type: "t", value: THREE.ImageUtils.loadTexture("/images/cloud4.png") }
        };
        var vertexshader = document.getElementById( 'vertexshader' ).textContent
                              .replace('{{PIXELS_PER_AU}}', PIXELS_PER_AU.toFixed(1));
        var particle_system_shader_material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            attributes:     attributes,
            vertexShader:   vertexshader,
            fragmentShader: document.getElementById( 'fragmentshader' ).textContent
        });
        particle_system_shader_material.depthTest = false;
        particle_system_shader_material.transparent = true;
        particle_system_shader_material.vertexColor = true;
        // TODO
        /*
          transparent: true,
          depthTest: false,
          vertexColor: true
          */
        psg_vertex_offset = added_objects.length - particle_system_geometry.vertices.length;
        for( var i = 0; i < particle_system_geometry.vertices.length; i++ ) {
          // set alpha based on distance to (local) y-axis
          attributes.alpha.value[ i ] = Math.abs( particle_system_geometry.vertices[ i ].x / 100 );
          if (i < psg_vertex_offset) {
            // these are planets and bigParticles, our shaders won't apply
            continue;
          }
          attributes.a.value[i] = added_objects[i].eph.a;
          attributes.e.value[i] = added_objects[i].eph.e;
          attributes.i.value[i] = added_objects[i].eph.i;
          attributes.o.value[i] = added_objects[i].eph.om;
          attributes.p.value[i] = added_objects[i].eph.p;
          attributes.ma.value[i] = added_objects[i].eph.ma;
          attributes.n.value[i] = added_objects[i].eph.n || -1.0;
          attributes.w.value[i] = added_objects[i].eph.w;
          attributes.P.value[i] = added_objects[i].eph.P;
          attributes.epoch.value[i] = added_objects[i].eph.epoch;
        }

        particleSystem = new THREE.ParticleSystem(
          particle_system_geometry,
          //particle_system_material
          particle_system_shader_material
        );

        // add it to the scene
        particleSystem.sortParticles = true;
        scene.add(particleSystem);
      }
      asteroids_loaded = true;

      console.log('Starting with', NUM_WORKERS, 'workers for', n, 'from request of', MAX_NUM_ORBITS);
      initSimulation();
      //startSimulation();
      animate();
      $('#loading').hide();
    });
  }

  function starTexture(color, size) {
    var size = (size) ? parseInt(size*24) : 24;
    var canvas = document.createElement( 'canvas' );
    canvas.width = size;
    canvas.height = size;
    var col = new THREE.Color(color);

    var context = canvas.getContext( '2d' );
    var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
    var rgbaString = 'rgba(' + ~~ ( col.r * 255 ) + ',' + ~~ ( col.g * 255 ) + ',' + ~~ ( col.b * 255 ) + ',' + (1) + ')';
    gradient.addColorStop( 0, rgbaString);
    gradient.addColorStop( 0.1, rgbaString);
    gradient.addColorStop( 0.6, 'rgba(125, 20, 0, 0.2)' );
    gradient.addColorStop( .92, 'rgba(0,0,0,0)' );
    context.fillStyle = gradient;
    context.fillRect( 0, 0, canvas.width, canvas.height );
    return canvas;
  }

  function changeJED(new_jed) {
    for (var i=0; i < workers.length; i++) {
      workers[i].postMessage({
        command: 'set_jed',
        jed: new_jed
      });
    }
  }
})();
if (!window.console) window.console = {log: function() {}};
