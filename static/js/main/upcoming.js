
$(function() {

  var diagram = new EarthOrbitDiagram('#diagram', {
    diagram_height: $(window).height(),
    diagram_width: $(window).width(),
    // .0026 AU = 20 pixels
    diagram_au_factor: 20/.0026,
  });

  diagram.prepareRender();
  diagram.plotEarth();

  // Moon
  diagram.renderAnother(.00260, 0, 0, 'red');

  // Apophis
  diagram.renderAnother(.0026, 0, 0, 'blue');

});
