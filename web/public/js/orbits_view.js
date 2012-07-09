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

  OrbitsView.prototype.addOrbit = function(obj) {
    diagram.renderAnother(obj.a, obj.e, obj.om)
      .on("mouseover", function(){
        d3.select(this).style('stroke', 'red');
        $('#orbits-view-info-text').html(obj.full_name + ': $' + obj.fuzzed_price);
      })
      .on("mouseout", function(){
        d3.select(this).style('stroke', 'white');
        $('#orbits-view-info-text').empty();
      })
  }

  OrbitsView.prototype.addAllOrbits = function() {
    var lastResults = Asterank.getLastResults().sort(function(a, b) {
      return b.a - a.a;
    });

    for (var i=0; i < lastResults.length; i++) {
      var obj = lastResults[i];
      this.addOrbit(obj)
    }
  }

  return OrbitsView;
})();

$(function() {
  window.foo = new OrbitsView('#orbits-view-main');
  Asterank.search();
  setTimeout(function() {
    foo.addAllOrbits();
  }, 500);
});
