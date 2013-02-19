function Asterank3DCtrl($scope, pubsub) {

  $scope.Init = function() {
    asterank3d = new Asterank3D(document.getElementById('webgl-container'));
  }

  pubsub.subscribe('Lock3DView', function(asteroid) {
    asterank3d.setLock(asteroid.full_name);
  });

  pubsub.subscribe('NewAsteroidRanking', function(rankings) {
    asterank3d.clearRankings();
    asterank3d.processAsteroidRankings(rankings);
  });

  pubsub.subscribe('Default3DView', function() {
    asterank3d.clearLock();
  });
}
