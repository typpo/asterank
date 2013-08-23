function AsteroidLookupCtrl($scope, $http, pubsub) {
  'use strict';
  var PRESELECT_URL_PARAM = 'object';

  $scope.lookup_query = '';

  $scope.Init = function() {
    var preselected = getURLParameter(PRESELECT_URL_PARAM);
    if (preselected) {
      // FIXME if preselected is already in the list by default,
      // both are highlighted.
      $scope.autocomplete_default_text = preselected;
      // We manually hit the autocomplete endpoint.  Was
      // not straightforward to trigger dropdown + selection.
      $http.get('/api/autocomplete?query=' + preselected)
        .success(function(data) {
          if (!data.length || data.length < 1) {
            alert('Sorry, could not load object "' + preselected + '"');
            return;
          }
          pubsub.publish('UpdateRankingsWithFeaturedAsteroid', [data[0]]);
      });
    }
  }

  $scope.Lookup = function(suggestion) {
    pubsub.publish('UpdateRankingsWithFeaturedAsteroid', [suggestion.data]);
  }
}
