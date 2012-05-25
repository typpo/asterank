var DIAGRAM_HEIGHT = 300, DIAGRAM_WIDTH = 300;
var SUN_X = DIAGRAM_HEIGHT / 2, SUN_Y = DIAGRAM_WIDTH / 2;
var DIAGRAM_AU_FACTOR = 50;
var orbit_svg;

function renderOrbitalDiagram(a, e) {
  $('#orbit-viz').empty();
  orbit_svg = d3.select("#orbit-viz")
      .append("svg:svg")
      .attr("width", DIAGRAM_HEIGHT)
      .attr("height", DIAGRAM_WIDTH);

  plotSun();
  plotEarth();
  plotMars();

  plotOrbit(a, e, 'black');
}

function plotOrbit(a, e, color) {
  var b = a * Math.sqrt(1 - e * e);
  var q = a*(1-e);
  var Q = a*(1+e);
  var f = a * e;
  plotCoords(b * DIAGRAM_AU_FACTOR, a * DIAGRAM_AU_FACTOR, f * DIAGRAM_AU_FACTOR, f * DIAGRAM_AU_FACTOR, color);
}

function plotCoords(rx, ry, dcx, dcy, color) {
  color = color || 'black';
  orbit_svg.append("svg:ellipse")
      .style("stroke", color)
      .style("fill", "transparent")
      .attr("rx", rx)
      .attr("ry", ry)
      .attr("cx", SUN_X)
      .attr("cy", SUN_Y + dcy);
}

function plotSun() {
  orbit_svg.append("svg:ellipse")
      .style("stroke", "black")
      .style("fill", "black")
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("cx", SUN_X)
      .attr("cy", SUN_Y);
}

function plotEarth() {
  plotOrbit(1.00000011, 0.01671022, 'blue');
}

function plotMars() {
  plotOrbit(1.52366231, 0.0935, 'red');
}

function plotCeres() {
  plotOrbit(2.765348506018043, 0.07913825487621974, 'black');
}

function plotEros() {
  plotOrbit(1.457930481032983, 0.2225304579974197, 'black');
}
