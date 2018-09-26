function AsteroidTableCtrl($scope, $http, pubsub) {
  'use strict';
  // Config
  $scope.rankings = [];
  $scope.loading_initial_rankings = true;
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
    },
    {
      text: 'smallest',
      search_value: 'smallest'
    },
    {
      text: 'closest approaching',
      search_value: 'moid'
    }
  ];
  $scope.limit_options = [10, 100, 300, 500, 1000, 4000];

  // Functions

  $scope.Init = function() {
    // Initialization
    $scope.limit = $scope.limit_options[2];
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
      // publish to subscribers (incl. 3d view)
      pubsub.publish('NewAsteroidRanking', [$scope.rankings]);
      BroadcastInitialRankingsLoaded();
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

        // publish to subscribers (incl. 3d view)
        pubsub.publish('NewAsteroidRanking', [$scope.rankings]);
        BroadcastInitialRankingsLoaded();
      });
    }

  } // end UpdateRankings

  $scope.AsteroidClick = function(obj) {
    if (obj === $scope.selected) {
      // deselect
      $scope.selected = null;
    }
    else {
      $scope.selected = obj;
    }
    pubsub.publish('AsteroidDetailsClick', [obj]);
  }

  var inserted_asteroids = {};
  pubsub.subscribe('UpdateRankingsWithFeaturedAsteroid', function(asteroid) {
    // normal rankings, except we insert a featured asteroid on top
    $scope.selected = asteroid;

    if (!inserted_asteroids[asteroid.full_name]) {
      // update rankings
      $scope.rankings.unshift(asteroid);

      // send new rankings to 3d view
      pubsub.publish('NewAsteroidRanking', [$scope.rankings]);

      inserted_asteroids[asteroid.full_name] = true;
    }

    // load details
    pubsub.publish('AsteroidDetailsClick', [asteroid]);
  });

  function BroadcastInitialRankingsLoaded() {
    if ($scope.loading_initial_rankings) {
      pubsub.publish('InitialRankingsLoaded');
      $scope.loading_initial_rankings = false;
    }
  }
}

