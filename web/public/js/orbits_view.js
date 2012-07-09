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

    // Extra stuff
    diagram.plotJupiter();
  }

  OrbitsView.prototype.addOrbit = function() {
    diagram.render.apply(diagram, arguments);
  }

  OrbitsView.prototype.addAllOrbits = function() {
    var lastResults = Asterank.getLastResults();
    for (var i=0; i < lastResults.length; i++) {
      var obj = lastResults[i];
      this.addOrbit(obj.a, obj.e, obj.om);
    }
  }

  return OrbitsView;
})();

$(function() {
  window.foo = new OrbitsView('#orbits-view-main');
});
