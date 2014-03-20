window.OrbitDiagram = (function() {
  'use strict';

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

  OrbitDiagram.prototype.prepareRender = function() {
    this.$e.empty();
    this.orbit_svg = d3.select(this.selector)
        .append("svg:svg")
        .attr("width", this.DIAGRAM_WIDTH)
        .attr("height", this.DIAGRAM_HEIGHT)

    this.plotSun();
  }

  OrbitDiagram.prototype.renderPlanets = function() {
    this.plotEarth();
    this.plotVenus();
    this.plotMercury();
    this.plotMars();
  }

  OrbitDiagram.prototype.render = function(a, e, w) {
    this.prepareRender();
    this.renderPlanets();
    return this.renderAnother(a, e, w);
  }

  OrbitDiagram.prototype.renderAnother = function(a, e, w) {
    return this.plotOrbit(a, e, w, 'white');
  }

  OrbitDiagram.prototype.plotOrbit = function(a, e, w, color) {
    var sqrtme = 1 - e * e;
    var b = a * Math.sqrt(Math.max(0, sqrtme));
    var f = a * e;

    var rx = b * this.DIAGRAM_AU_FACTOR;
    var ry = Math.abs(a * this.DIAGRAM_AU_FACTOR);
    var foci = f * this.DIAGRAM_AU_FACTOR;

    return this.plotCoords(rx, ry, foci, w, color);
  }

  OrbitDiagram.prototype.plotCoords = function(rx, ry, f, rotate_deg, color) {
    color = color || 'white';
    var cx = this.SUN_X;
    var cy = this.SUN_Y + f;

    return this.orbit_svg.append("svg:ellipse")
        .style("stroke", color)
        .style("fill", 'none')
        .attr("rx", rx)
        .attr("ry", ry)
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("transform", "rotate(" + rotate_deg + ", " + this.SUN_X + ", " + this.SUN_Y + ")")
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
    this.plotOrbit(1.00000011, 0.01671022, 102.93768193, 'cyan');
  }

  OrbitDiagram.prototype.plotJupiter = function() {
    this.plotOrbit(5.20336301, 0.04839266, 14.72847983, 'orange');
  }

  OrbitDiagram.prototype.plotMars = function() {
    this.plotOrbit(1.52366231, 0.0935, 336.04084, 'red');
  }

  OrbitDiagram.prototype.plotVenus = function() {
    this.plotOrbit(0.72333199, 0.00677323, 131.60246718, 'orange');
  }

  OrbitDiagram.prototype.plotMercury = function() {
    this.plotOrbit(0.38709893, 0.20563069, 77.45779628, 'purple');
  }

  return OrbitDiagram;
})();
