function AsteroidLookupCtrl($scope, $http, pubsub) {
  $scope.lookup_query = '';

  $scope.Init = function() {

  }

  $scope.Lookup = function(suggestion) {
    pubsub.publish('UpdateRankingsWithFeaturedAsteroid', [suggestion.data]);
    pubsub.publish('AsteroidDetailsClick', [suggestion.data]);
  }
}
