$(function() {
  $.getJSON('/static/js/main/upcoming_asteroids_annotated.json', function(data) {
    render(data);
  });
});

function render(asteroids) {
  var MAX_ASTEROIDS = 512;
  var MAX_YEAR = 2136;
  var NOW_YEAR = 2015;
  var MOON_VISIBLE = false;

  var YEAR_SLICE_ANGLE_SEPARATOR = 26;
  var YEAR_SLICES = [2015, 2025, 2035, 2046, 2055, 2065, 2075,
                     2076, 2086, 2096, 2106, 2116, 2126, 2136];
  var YEAR_ANGLES = [12, 38, 64, 90, 116, 142, 168,
                     192, 218, 244, 270, 296, 322, 348];

  var diagram = new EarthOrbitDiagram('#diagram', {
    diagram_height: $(window).height(),
    diagram_width: $(window).width(),
    // .00026 AU = 20 pixels
    //diagram_au_factor: 20/.00026,

    // Moon's distance = N px
    diagram_au_factor: 100/.0026,
  });

  diagram.prepareRender();
  /*
  var offset = 18;
  var c = 0;
  for (var i=0; i <= 324; i+=27) {
    // Use 324 degrees
    // the remaining 36 degrees becomes two 18-degree offsets for the book page gutter
    var color = '#ddd';
    var deg = i;
    if (c === 0) {
      // midnight
      color = 'red';
      deg += 18;
    }
    if (c === 6) {
      // 6 oclock
      color = 'red';
      deg += 36;
    }
    diagram.plotSlice(deg, {
      stroke_width: 1.2,
      color: color
    });
    c++;
  }
 */
/*
  for (var i=0; i <= 360; i+=30) {
    diagram.plotSlice(i, {
      stroke_width: 1.2
    });
  }
  */
  var prev_angle = YEAR_ANGLES[YEAR_ANGLES.length - 1];
  YEAR_SLICES.map(function(year, i) {
    //var angle = (360 *  (year - NOW_YEAR))/(MAX_YEAR-NOW_YEAR);
    var angle = YEAR_ANGLES[i];
    diagram.plotSlice(angle, {
      stroke_width: 1.2
    });

    /*
    if (prev_angle) {
      for (var j=0; j < 5; j++) {
        diagram.plotSlice(prev_angle + (prev_angle - angle)/5*j, {
          stroke_width: .5
        });
      }
    }
    prev_angle = angle;
   */
  });

  for (var j=0; j < YEAR_SLICES.length; j++) {
    var before_angle;
    var after_angle;
    if (j === 0) {
      before_angle = YEAR_ANGLES[YEAR_ANGLES.length - 1];
      after_angle = before_angle + YEAR_SLICE_ANGLE_SEPARATOR;
    } else {
      before_angle = YEAR_ANGLES[j-1];
      after_angle = YEAR_ANGLES[j];
    }
    var angle_offset = (before_angle - after_angle)/5;
    for (var k=1; k < 5; k++) {
      diagram.plotSlice(before_angle + k*angle_offset, {
        stroke_width: .5,
        color: '#ddd',
      });
    }
  }
/*
  for (var i=0; i <= 360; i+=6) {
    if (i % 30 === 0) continue;
    diagram.plotSlice(i, {
      stroke_width: .5
    });
  }
 */
  diagram.plotEarth();

  // Concentric circles marking X moon distance
  var dist = .0026;
  for (var i=0; i < 50; i++) {
    diagram.plotOrbit({
      a: dist,
      orbit_color: '#ccc',
    });
    dist += .001;
  }

  if (MOON_VISIBLE) {
    // Moon
    diagram.plotOrbit({
      a: .0026,
      w: 0,
      object_color: '#ccc',
      orbit_color: null,
      label: 'Moon',
      size: 20,
    });
  }

  /*
  // Geosynchronous
  diagram.plotOrbit({
    a: 0.000239214635,
    w: 0,
    object_color: '#ccc',
    orbit_color: null,
    label: 'GEO',
    size: 5,
  });

  // ISS
  diagram.plotOrbit({
    a: 1.67114678e-6,
    w: 0,
    object_color: '#ccc',
    orbit_color: null,
    label: 'ISS',
    size: 5,
  });
  */

  // Asteroid orbits
  for (var j=0; j < asteroids.length && j < MAX_ASTEROIDS; j++) {
    var roid = asteroids[j];
    if (roid.year > MAX_YEAR) {
      j--;
      continue;
    }
    var date = roid.month + ' ' + parseInt(roid.day) + ', ' + roid.year;

    // Figure out timeslice
    var angle = null;
    for (var i=1; i < YEAR_SLICES.length; i++) {
      if (YEAR_SLICES[i] > roid.year) {
        // it belongs in this year slice
        var above_year = YEAR_SLICES[i-1];
        var below_year = YEAR_SLICES[i];
        var above_angle = YEAR_ANGLES[i-1];
        var below_angle = YEAR_ANGLES[i];
        angle = above_angle + (below_angle - above_angle)
                  * (roid.year - above_year) / (below_year - above_year);
        break;
      }
    }

    diagram.plotOrbit({
      label: roid.name,
      sublabel: date,
      a: roid.distance,
      // year MAX_YEAR = 360 degrees
      //w: -1 * (360 *  (roid.year - NOW_YEAR))/(MAX_YEAR-NOW_YEAR),
      w: angle,
      object_color: '#7c7070',
      //object_outline_color: '#e0d4d4',
      object_outline_color: '#ff7b7b',
      orbit_color: null,
      size: Math.max(2, (roid.diameter*10+1)^2),
    });
  }

  // Timeslice labels
  YEAR_SLICES.map(function(year, i) {
    //var angle = (360 *  (year - NOW_YEAR))/(MAX_YEAR-NOW_YEAR);
    var angle = YEAR_ANGLES[i];
    diagram.plotSliceLabel(angle, {
      label: ''+year
    });
  });
}
