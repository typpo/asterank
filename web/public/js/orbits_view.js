window.OrbitsView = (function() {
  "use strict";
  var diagram;

  function OrbitsView(main_selector, description_selector) {
    if ($(main_selector).length < 1) return;

    this.$div = $(main_selector);
    diagram = new OrbitDiagram(main_selector, {
      diagram_width: this.$div.width(),
      diagram_height: this.$div.height(),
    });

    diagram.prepareRender();
    diagram.renderPlanets();
    diagram.plotJupiter();  // not included by default

    this.$description = $(description_selector);
  }

  OrbitsView.prototype.addOrbit = function(obj) {
    var me = this;
    diagram.renderAnother(obj.a, obj.e, obj.w)
      .on("mouseover", function(){
        d3.select(this).style('stroke', 'red');
        me.$description.html(obj.full_name + ': $' + obj.fuzzed_price);
      })
      .on("mouseout", function(){
        d3.select(this).style('stroke', 'white');
        me.$description.empty();
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

/*
$(function() {
  console.log('orbits view');
  window.foo = new OrbitsView('#orbits-view-main', '#orbits-view-info-text');
  Asterank.search();
  setTimeout(function() {
    foo.addAllOrbits();
  }, 1000);
});
*/
