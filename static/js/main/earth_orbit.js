window.EarthOrbitDiagram = (function() {
  'use strict';

  var EARTH_FATNESS = 60; // px
  var LABELING_ENABLED = false;

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
        .attr('stroke', '#ddd')
        .attr('stroke-width', stroke_width)
  };

  EarthOrbitDiagram.prototype.plotSliceLabel = function(angle_deg, opts) {
    var stroke_width = opts.stroke_width || .5;
    var cx = this.SUN_X;
    var cy = this.SUN_Y;
    var rads = angle_deg * Math.PI/180;
    rads -= Math.PI / 2;  // rotate 90 counterclokwise
    var r = 450;
    var xcoord = cx + r * Math.cos(rads);
    var ycoord = cy + r * Math.sin(rads);
    if (angle_deg === 90 || angle_deg == 270) {
      // Lift above the line a little bit
      ycoord -= 3;
    }
    // Rotate 90
    var text = this.orbit_svg.append('svg:text')
        .attr('font-family', 'sans-serif')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .attr('fill', '#eee')
        .attr('x', xcoord)
        .attr('y', ycoord)
        .text(opts.label)
    text.attr('dx', -text.node().getBoundingClientRect().width / 2);
  };

  EarthOrbitDiagram.prototype.plotCoords = function(opts) {
    var rx = opts.rx;
    var ry = opts.ry;
    var f = opts.foci;
    // rotate so 0 is pointing straight up, like a clock
    var rotate_deg = -(opts.w + 90);
    var object_color = opts.object_color;
    var object_outline_color = opts.object_outline_color || 'red';
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
          .style('stroke', object_outline_color)
          .style('fill', object_color)
          // TODO scale by size
          .attr('rx', size)
          .attr('ry', size)
          .attr('cx', cx+rx)
          .attr('cy', cy)
          .attr('transform', 'rotate(' + rotate_deg + ', ' + this.SUN_X + ', ' + this.SUN_Y + ')')

      if (opts.label && LABELING_ENABLED) {
        var bbox = obj.node().getBoundingClientRect();
        var text = this.orbit_svg.append('text')
            .text(opts.label)
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .attr('fill', 'red')

        var text_left_adjust = text.node().getBBox().width / 2 + size/2;

        text
            .attr('x', bbox.left - text_left_adjust)
            .attr('y', bbox.bottom + 4)

        var tspan = text.append('svg:tspan')
            .attr('font-size', '9px')
            .attr('dy', '1.4em')
            .attr('fill', '#ccc')
            .text(opts.sublabel)

        //var tspanwidth = text.node().getBoundingClientRect().left;
        tspan
            .attr('x', bbox.left - text_left_adjust)

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
