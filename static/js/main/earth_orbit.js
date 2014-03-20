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
  };

  EarthOrbitDiagram.prototype.prepareRender = function() {
    this.$e.empty();
    this.orbit_svg = d3.select(this.selector)
        .append('svg:svg')
        .attr('width', this.DIAGRAM_WIDTH)
        .attr('height', this.DIAGRAM_HEIGHT)

    this.plotEarth();
  };

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

  EarthOrbitDiagram.prototype.plotSlice = function(angle_deg, opts) {
    var stroke_width = opts.stroke_width || .5;
    angle_deg *= -1;
    var cx = this.SUN_X;
    var cy = this.SUN_Y;
    var rads = angle_deg * Math.PI/180;
    this.orbit_svg.append('svg:line')
        .attr('x1', cx + 160 * Math.cos(rads))
        .attr('y1', cy + 160 * Math.sin(rads))
        .attr('x2', cx + 2000 * Math.cos(rads))
        .attr('y2', cy + 2000 * Math.sin(rads))
        .attr('class', 'line')
        .attr('stroke', '#ccc')
        .attr('stroke-width', stroke_width)
  };

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
          .attr('stroke-width', .5)
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
        obj.append('svg:text')
            .text(opts.label)
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .attr('fill', 'red')
            .attr('cx', cx+rx)
            .attr('dy', '1.4em')
        /*
        var bbox = obj.node().getBoundingClientRect();
        var text = this.orbit_svg.append('text')
            .text(opts.label)
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .attr('fill', 'red')

        var text_left_adjust = text.node().getBBox().width / 2 + size/2;

          console.log(bbox);
        text
            .attr('x', bbox.left - text_left_adjust)
            .attr('y', bbox.bottom + 4)

        var tspan = text.append('svg:tspan')
            .attr('font-size', '9px')
            .attr('dy', '1.4em')
            .attr('fill', '#ccc')
            .text(opts.sublabel)

        var tspanwidth = text.node().getBoundingClientRect().left
                          + bbox.width/2;
        tspan
            .attr('x', tspanwidth)
            */

      }
    }
  };

  EarthOrbitDiagram.prototype.plotEarth = function() {
    this.orbit_svg.append('svg:ellipse')
        .style('stroke', 'gray')
        .style('fill', 'steelblue')
        .attr('rx', EARTH_FATNESS)
        .attr('ry', EARTH_FATNESS)
        .attr('cx', this.SUN_X)
        .attr('cy', this.SUN_Y);
  };

  return EarthOrbitDiagram;
})();
