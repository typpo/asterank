function Asterank3DCtrl($scope, pubsub) {
  $scope.running = true;

  $scope.Init = function() {
    asterank3d = new Asterank3D(document.getElementById('webgl-container'));
  }

  $scope.SunView = function() {
    asterank3d.clearLock();
  }

  $scope.EarthView = function() {
    asterank3d.setLock('earth');
  }

  $scope.Pause = function() {
    asterank3d.pause();
    $scope.running = false;
  }

  $scope.Play = function() {
    asterank3d.play();
    $scope.running = true;
  }

  $scope.FullView = function() {
    window.location.href="http://asterank.com/3d";
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
