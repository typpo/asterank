window.OrbitsView = (function() {
  "use strict";

  var diagram;

  function OrbitsView(selector) {
    if ($(selector).length < 1) return;

    diagram = new OrbitDiagram(selector, {
      diagram_width: $(selector).width(),
      diagram_height: $(selector).height(),
    });

    diagram.prepareRender();

    diagram.plotSun();
  }

  OrbitsView.prototype.addOrbit = function() {
    diagram.render.apply(diagram, arguments);
  }

  return OrbitsView;
})();

$(function() {
  window.foo = new OrbitsView('#orbits-view-main');
});
