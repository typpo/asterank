
$(function() {

  var diagram = new EarthOrbitDiagram('#diagram', {
    diagram_height: $(window).height(),
    diagram_width: $(window).width(),
    // .00026 AU = 20 pixels
    //diagram_au_factor: 20/.00026,

    // Moon's distance = 300px
    diagram_au_factor: 300/.0026,
  });

  diagram.prepareRender();
  diagram.plotEarth();

  // Concentric circles
  var dist = .0026;
  for (var i=0; i < 50; i++) {
    diagram.plotOrbit({
      a: dist,
    });
    dist = .0026;
  }

  // Moon
  diagram.plotOrbit({
    a: .0026,
    w: 180,
    object_color: '#ccc',
  });

  // Geosynchronous
  diagram.plotOrbit({
    a: 0.000239214635,
    w: 180,
    object_color: '#ccc',
  });

  // ISS
  diagram.plotOrbit({
    a: 1.67114678e-6,
    w: 180,
    object_color: '#ccc',
  });

  // Apophis
  var deg = 0;
  for (var i=0; i < asteroids.length && i < 20; i++) {
    var roid = asteroids[i];
    diagram.plotOrbit({
      a: roid.distance,
      w: deg,
      object_color: 'pink',
    });
    deg -= 5;
  }
});
