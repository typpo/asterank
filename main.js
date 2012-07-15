(function() {
  "use strict";

  var WEB_GL_ENABLED = false;
  var stats, scene, renderer, composer;
  var camera, cameraControls;

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
    scene.add(camera);

    cameraControls	= new THREE.TrackballControls(camera)

    // Other setup
    THREEx.WindowResize.bind(renderer, camera);
    THREEx.Screenshot.bindKey(renderer);
    if(THREEx.FullScreen.available()){
      THREEx.FullScreen.bindKey();
      document.getElementById('inlineDoc').innerHTML	+= "- <i>f</i> for fullscreen";
    }

    // my stuff
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
    })();

    function addGeometry( points, color, x, y, z, rx, ry, rz, s ) {
      var line = new THREE.Line( points, new THREE.LineBasicMaterial( { color: color, linewidth: 2 } ) );
      line.position.set( x, y, z);
      line.rotation.set( rx, ry, rz );
      line.scale.set( s, s, s );
      scene.add( line );
    }

    function drawEllipse(ctx, x, y, w, h) {
      var kappa = .5522848
       , ox = (w / 2) * kappa // control point offset horizontal
       , oy = (h / 2) * kappa // control point offset vertical
       , xe = x + w           // x-end
       , ye = y + h           // y-end
       , xm = x + w / 2       // x-middle
       , ym = y + h / 2       // y-middle

      ctx.moveTo(x, ym);
      ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
      ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
      ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
      ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
    }

    // foo
    (function() {
      var shape = new THREE.Shape();
      drawEllipse(shape, 0, 0, 100, 200);

      var shapePoints = shape.createPointsGeometry();
      addGeometry(shapePoints, 0xffee00, 0,0,0,0, 0, 0, 1);
    })();
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
    cameraControls.update();
    // actually render the scene
    renderer.render(scene, camera);
  }
})();
