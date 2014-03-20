window.EarthOrbitDiagram = (function() {
  'use strict';

  var EARTH_FATNESS = 60; // px

  function EarthOrbitDiagram(selector, options) {
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

  EarthOrbitDiagram.prototype.prepareRender = function() {
    this.$e.empty();
    this.orbit_svg = d3.select(this.selector)
        .append('svg:svg')
        .attr('width', this.DIAGRAM_WIDTH)
        .attr('height', this.DIAGRAM_HEIGHT)

    this.plotEarth();
  }

  EarthOrbitDiagram.prototype.render = function(a, e, w) {
    this.prepareRender();
    return this.renderAnother(a, e, w);
  }

  EarthOrbitDiagram.prototype.plotOrbit = function(opts) {
    var a = opts.a;
    var e = opts.e || 0;
    var w = opts.w || 0;

    var sqrtme = 1 - e * e;
    var b = a * Math.sqrt(Math.max(0, sqrtme));
    var f = a * e;

    var rx = b * this.DIAGRAM_AU_FACTOR + EARTH_FATNESS;
    var ry = Math.abs(a * this.DIAGRAM_AU_FACTOR) + EARTH_FATNESS;

    var foci = f * this.DIAGRAM_AU_FACTOR;

    return this.plotCoords($.extend(opts, {
      rx: rx,
      ry: ry,
      foci: foci,
      w: w,
    }));
  }

  EarthOrbitDiagram.prototype.plotCoords = function(opts) {
    var rx = opts.rx;
    var ry = opts.ry;
    var f = opts.foci;
    var rotate_deg = opts.w;
    var object_color = opts.object_color;
    var orbit_color = opts.orbit_color;
    var size = opts.size || 10;

    var cx = this.SUN_X;
    var cy = this.SUN_Y + f;

    if (orbit_color) {
      this.orbit_svg.append('svg:ellipse')
          .style('stroke', orbit_color)
          .style('fill', 'none')
          .attr('rx', rx)
          .attr('ry', ry)
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('transform', 'rotate(' + rotate_deg + ', ' + this.SUN_X + ', ' + this.SUN_Y + ')')
    }

    if (object_color) {
      var obj = this.orbit_svg.append('svg:ellipse')
          .style('stroke', 'red')
          .style('fill', object_color)
          // TODO scale by size
          .attr('rx', size)
          .attr('ry', size)
          .attr('cx', cx+rx)
          .attr('cy', cy)
          .attr('transform', 'rotate(' + rotate_deg + ', ' + this.SUN_X + ', ' + this.SUN_Y + ')')

      if (opts.label) {
        var bbox = obj.node().getBoundingClientRect();
        var text = this.orbit_svg.append('text')
            .text(opts.label)
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .attr('fill', 'red')

        text
            .attr('x', bbox.left - (text.node().getBBox().width / 2))
            .attr('y', bbox.bottom + 4)
      }
    }
  }

  EarthOrbitDiagram.prototype.plotEarth = function() {
    this.orbit_svg.append('svg:ellipse')
        .style('stroke', 'gray')
        .style('fill', 'steelblue')
        .attr('rx', EARTH_FATNESS)
        .attr('ry', EARTH_FATNESS)
        .attr('cx', this.SUN_X)
        .attr('cy', this.SUN_Y);
  }

  /*
  EarthOrbitDiagram.prototype.plotEarth = function() {
    this.plotOrbit(1.00000011, 0.01671022, 102.93768193, 'cyan');
  }

  EarthOrbitDiagram.prototype.plotJupiter = function() {
    this.plotOrbit(5.20336301, 0.04839266, 14.72847983, 'orange');
  }

  EarthOrbitDiagram.prototype.plotMars = function() {
    this.plotOrbit(1.52366231, 0.0935, 336.04084, 'red');
  }

  EarthOrbitDiagram.prototype.plotVenus = function() {
    this.plotOrbit(0.72333199, 0.00677323, 131.60246718, 'orange');
  }

  EarthOrbitDiagram.prototype.plotMercury = function() {
    this.plotOrbit(0.38709893, 0.20563069, 77.45779628, 'purple');
  }
  */

  return EarthOrbitDiagram;
})();
