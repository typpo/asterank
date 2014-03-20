
$(function() {

  var diagram = new EarthOrbitDiagram('#diagram', {
    diagram_height: $(window).height(),
    diagram_width: $(window).width(),
    // .00026 AU = 20 pixels
    diagram_au_factor: 20/.00026,
  });

  diagram.prepareRender();
  diagram.plotEarth();

  // Moon
  diagram.renderAnother(.0026, 0, 180, '#ccc');

  // Apophis
  diagram.renderAnother(.00026, 0, 0, 'pink');
});
