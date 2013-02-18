function Asterank3DCtrl($scope, pubsub) {

  $scope.Init = function() {
    // TODO move to directive...
    asterank3d = new Asterank3D(document.getElementById('webgl-container'));
  }

  pubsub.subscribe('AsteroidDetailsClick', function(asteroid) {
    asterank3d.setLock(asteroid.full_name);
  });

  pubsub.subscribe('NewAsteroidRanking', function(rankings) {
    asterank3d.clearRankings();
    asterank3d.processAsteroidRankings(rankings);
  });
}
