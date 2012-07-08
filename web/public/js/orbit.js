var DIAGRAM_HEIGHT = 170, DIAGRAM_WIDTH = 300;
var SUN_X = DIAGRAM_WIDTH / 2, SUN_Y = DIAGRAM_HEIGHT / 2 - 10;
var DIAGRAM_AU_FACTOR = 50;
var orbit_svg;

function OrbitDiagram(selector) {
  this.$e = $(selector);
  this.selector = selector;
  this.orbit_svg = null;
}

OrbitDiagram.prototype.render = function(a, e, om) {
  this.$e.empty();
  this.orbit_svg = d3.select(this.selector)
      .append("svg:svg")
      .attr("width", DIAGRAM_WIDTH)
      .attr("height", DIAGRAM_HEIGHT)

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

  var rx = b * DIAGRAM_AU_FACTOR;
  var ry = a * DIAGRAM_AU_FACTOR;
  var foci = f * DIAGRAM_AU_FACTOR;

  /*
  var rotated_x = rx, rotated_y = ry;
  if (om && false) {
    console.log('before', rotated_x);
    var rad_om = om * Math.PI / 180;
    rotated_x = rx * Math.cos(rad_om) - ry * Math.sin(rad_om);
    rotated_y = ry * Math.cos(rad_om) + rx * Math.sin(rad_om);
    console.log('then', rotated_x);
  }
  */
  this.plotCoords(rx, ry, foci, om, color);
}

OrbitDiagram.prototype.plotCoords = function(rx, ry, f, rotate_deg, color) {
  color = color || 'white';
  var cx = SUN_X;
  var cy = SUN_Y + f;

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
      .attr("cx", SUN_X)
      .attr("cy", SUN_Y);
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
