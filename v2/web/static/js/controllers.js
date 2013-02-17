function AsteroidTableCtrl($scope, $http, pubsub) {
  'use strict';
  // Config
  $scope.rankings = [];
  $scope.sort_orders = [
    {
      text: 'most cost effective',
      search_value: 'score'
    },
    {
      text: 'most valuable',
      search_value: 'value'
    },
    {
      text: 'most accessible',
      search_value: 'accessibility'
    },
    {
      text: 'upcoming passes',
      search_value: 'upcoming'
    }
  ];
  $scope.limit_options = [100, 300, 500, 1000, 4000];

  // Functions

  $scope.Init = function() {
    // Initialization
    $scope.limit = $scope.limit_options[0];
    $scope.sort_by = $scope.sort_orders[0];

    $scope.UpdateRankings();
  }

  var rankings_cache = new SimpleCache(function(item) {
    return item.sort_by + '|' + item.limit;
  });

  $scope.UpdateRankings = function() {
    var params = {
      sort_by: $scope.sort_by.search_value,
      limit: $scope.limit
    };
    var cache_result = rankings_cache.Get(params);
    if (cache_result) {
      $scope.rankings = cache_result;
    }
    else {
      $('#results-table-loader').show();
      $scope.rankings = [];
      $http.get('/api/rankings?sort_by='
          + params.sort_by
          + '&limit='
          + params.limit)
        .success(function(data) {
        $scope.rankings = data;
        rankings_cache.Set(params, data);
        $('#results-table-loader').hide();
      });
    }
  }

  $scope.AsteroidClick = function(obj) {
    $scope.selected = obj;
    pubsub.publish('AsteroidDetailsClick', [obj]);
  }
}

function AsteroidDetailsCtrl($scope, $http, pubsub) {
  'use strict';

  var MPC_FIELDS_TO_INCLUDE = {
    /*
    'a': {
      'name': 'Semimajor Axis',
      'units': 'AU'
    },
    'i': {
      'name': 'Inclination',
      'units': 'deg'
    },
    */
    'e': {
      'name': 'Eccentricity',
    },
    'class': {
      'name': 'Orbital class',
    },
    'epoch': {
      'name': 'Epoch',
    },
    'dv': {
      'name': 'Delta-v',
      'units': 'km/s'
    },
    'diameter': {
      'name': 'Diameter',
      'units': 'km?'
    },
    'ma': {
      'name': 'Mean Anomaly',
      'units': 'deg @ epoch'
    },
    'om': {
      'name': 'Longitude of Ascending Node',
      'units': 'deg @ J2000'
    },
    'w': {
      'name': 'Argument of Perihelion',
      'units': 'deg @ J2000'
    }
  };

  $scope.asteroid = null;
  $scope.asteroid_details = null;
  $scope.showing_stats = [];   // stats to show

  var jpl_cache = new SimpleCache();

  pubsub.subscribe('AsteroidDetailsClick', function(arg) {
    if ($scope.asteroid
      && arg.full_name === $scope.asteroid.full_name) return;

    // Update detailed click view
    $scope.asteroid = arg;

    // Flat fields that we just want to display
    $scope.stats = [];

    pubsub.publish('HideIntroStatement');

    // grab jpl asteroid details
    var query = $scope.asteroid.prov_des || $scope.asteroid.full_name;
    var cache_result = jpl_cache.Get(query);
    if (cache_result) {
      ShowData(cache_result);
    }
    else {
      $http.get('/jpl/lookup?query=' + query)
        .success(function(data) {
          ShowData(data);
      });
    }
    ShowOrbitalDiagram();
  });

  function ShowData(data) {
    // MPC/Horizons data
    // JPL data
    for (var attr in data) {
      if (!data.hasOwnProperty(attr)) continue;
      if (typeof data[attr] !== 'object') {
        if (data[attr] != -1) {
          $scope.stats.push({
            // TODO these need to have units as a separate structure attr
            name: attr.replace(/(.*?)\(.*?\)/, "$1"),
            units: attr.replace(/.*?\((.*?)\)/, "$1"),
            value: data[attr]
          });
        }
      }
    }

    for (var attr in MPC_FIELDS_TO_INCLUDE) {
      if (!MPC_FIELDS_TO_INCLUDE.hasOwnProperty(attr)) continue;
      var val = MPC_FIELDS_TO_INCLUDE[attr];
      $scope.stats.push({
        name: attr,
        units: val.units,
        value: $scope.asteroid[attr]
      });
    }

    // TODO special fields: next pass and close approaches
    // TODO composition
  }

  function ShowOrbitalDiagram() {
    // Orbital diagram
    var orbit_diagram = new OrbitDiagram('#orbit-2d-diagram', {

    });
    orbit_diagram.render(
        $scope.asteroid.a,
        $scope.asteroid.e,
        $scope.asteroid.w
    );
  }
}

function IntroStatementCtrl($scope, pubsub) {
  'use strict';
  $scope.show = true;

  pubsub.subscribe('HideIntroStatement', function() {
    $scope.show = false;
  });
}
