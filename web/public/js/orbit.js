var DIAGRAM_HEIGHT = 170, DIAGRAM_WIDTH = 300;
var SUN_X = DIAGRAM_WIDTH / 2, SUN_Y = DIAGRAM_HEIGHT / 2 - 10;
var DIAGRAM_AU_FACTOR = 90;
var orbit_svg;

function renderOrbitalDiagram(a, e, om) {
  $('#orbit-viz').empty();
  orbit_svg = d3.select("#orbit-viz")
      .append("svg:svg")
      .attr("width", DIAGRAM_WIDTH)
      .attr("height", DIAGRAM_HEIGHT)

  plotSun();
  plotEarth();
  plotVenus();
  plotMercury();
  plotMars();
  plotOrbit(a, e, om, 'white');
}

function plotOrbit(a, e, om, color) {
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
  plotCoords(rx, ry, foci, om, color);
}

function plotCoords(rx, ry, f, rotate_deg, color) {
  color = color || 'white';
  var cx = SUN_X;
  var cy = SUN_Y + f;

  orbit_svg.append("svg:ellipse")
      .style("stroke", color)
      .style("fill", "transparent")
      .attr("rx", rx)
      .attr("ry", ry)
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("transform", "rotate(" + (rotate_deg*Math.PI/180) + ", " + cx + ", " + cy + ")")
}

function plotSun() {
  orbit_svg.append("svg:ellipse")
      .style("stroke", "yellow")
      .style("fill", "yellow")
      .attr("rx", 2)
      .attr("ry", 2)
      .attr("cx", SUN_X)
      .attr("cy", SUN_Y);
}

function plotEarth() {
  plotOrbit(1.00000011, 0.01671022, -11.26064, 'cyan');
}

function plotMars() {
  plotOrbit(1.52366231, 0.0935, 49.57854, 'red');
}

function plotVenus() {
  plotOrbit(0.72333199, 0.00677323, 76.68069, 'orange');
}

function plotMercury() {
  plotOrbit(0.38709893, 0.20563069, 48.33167, 'purple');
}
