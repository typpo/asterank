function Asterank3DCtrl($scope, pubsub) {
  $scope.running = true;

  $scope.Init = function() {
    asterank3d = new Asterank3D({
      container: document.getElementById('webgl-container'),
      not_supported_callback: function() {
        // TODO should be angularified
        if (typeof mixpanel !== 'undefined') mixpanel.track('not supported');
        $('#webgl-not-supported').show();
        var $tc = $('#top-container');
        var $bc = $('#bottom-container');
        $tc.height($tc.height() + ($bc.height() - 250))
        $bc.height(250);
        var $rs = $('#right-side');
        var $ls = $('#left-side');
        $('#results-table-container').height($rs.height() + 250);
        $rs.height($rs.height() + 250);
        $ls.height($ls.height() + 250);
      },
      top_object_color: 0xffffff
    });
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
    if (asterank3d.isWebGLSupported()) {
      asterank3d.setLock(asteroid.full_name);
    }
  });

  pubsub.subscribe('NewAsteroidRanking', function(rankings) {
    asterank3d.clearRankings();
    if (asterank3d.isWebGLSupported()) {
      asterank3d.processAsteroidRankings(rankings);
    }
  });

  pubsub.subscribe('Default3DView', function() {
    if (asterank3d.isWebGLSupported()) {
      asterank3d.clearLock();
    }
  });
}
