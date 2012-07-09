window.OrbitDiagram = (function() {
  "use strict";
  function OrbitDiagram(selector, options) {
    this.$e = $(selector);
    this.selector = selector;
    this.orbit_svg = null;

    options = options || {};
    this.DIAGRAM_HEIGHT = options.diagram_height || 170;
    this.DIAGRAM_WIDTH = options.diagram_width || 300;
    this.SUN_X = options.sun_x || this.DIAGRAM_WIDTH / 2;
    this.SUN_Y = options.sun_y || this.DIAGRAM_HEIGHT / 2 - 10;
    this.DIAGRAM_AU_FACTOR = options.diagram_au_factor || 50;
  }

  OrbitDiagram.prototype.render = function(a, e, om) {
    this.$e.empty();
    this.orbit_svg = d3.select(this.selector)
        .append("svg:svg")
        .attr("width", this.DIAGRAM_WIDTH)
        .attr("height", this.DIAGRAM_HEIGHT)

    this.plotSun();
    this.plotEarth();
    this.plotVenus();
    this.plotMercury();
    this.plotMars();
    this.plotOrbit(a, e, om, 'white');
  }

  OrbitDiagram.prototype.plotOrbit = function(a, e, om, color) {
    var b = a * Math.sqrt(1 - e * e);
    var q = a*(1-e);
    var Q = a*(1+e);
    var f = a * e;

    var rx = b * this.DIAGRAM_AU_FACTOR;
    var ry = a * this.DIAGRAM_AU_FACTOR;
    var foci = f * this.DIAGRAM_AU_FACTOR;

    this.plotCoords(rx, ry, foci, om, color);
  }

  OrbitDiagram.prototype.plotCoords = function(rx, ry, f, rotate_deg, color) {
    color = color || 'white';
    var cx = this.SUN_X;
    var cy = this.SUN_Y + f;

    this.orbit_svg.append("svg:ellipse")
        .style("stroke", color)
        .style("fill", "transparent")
        .attr("rx", rx)
        .attr("ry", ry)
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("transform", "rotate(" + (rotate_deg*Math.PI/180) + ", " + cx + ", " + cy + ")")
  }

  OrbitDiagram.prototype.plotSun = function() {
    this.orbit_svg.append("svg:ellipse")
        .style("stroke", "yellow")
        .style("fill", "yellow")
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("cx", this.SUN_X)
        .attr("cy", this.SUN_Y);
  }

  OrbitDiagram.prototype.plotEarth = function() {
    this.plotOrbit(1.00000011, 0.01671022, -11.26064, 'cyan');
  }

  OrbitDiagram.prototype.plotMars = function() {
    this.plotOrbit(1.52366231, 0.0935, 49.57854, 'red');
  }

  OrbitDiagram.prototype.plotVenus = function() {
    this.plotOrbit(0.72333199, 0.00677323, 76.68069, 'orange');
  }

  OrbitDiagram.prototype.plotMercury = function() {
    this.plotOrbit(0.38709893, 0.20563069, 48.33167, 'purple');
  }

  return OrbitDiagram;
})();
