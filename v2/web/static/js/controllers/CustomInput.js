function CustomInputCtrl($scope, $http, pubsub) {
  $scope.object = {
    a: Ephemeris.earth.a,
    e: Ephemeris.earth.e,
    i: Ephemeris.earth.i,
    om: Ephemeris.earth.om,
    w: Ephemeris.earth.w_bar,
    ma: Ephemeris.earth.ma,
    epoch: Ephemeris.earth.epoch,
    per: Ephemeris.earth.P,
    spec_B: '?',    // necessary for composition lookup
    custom_object: true
  };
  $scope.num_custom_objects = 1;

  pubsub.subscribe('ShowCustomInputCtrl', function() {
    $scope.StartCustomOrbit();
  });

  $scope.StartCustomOrbit = function() {
    $scope.show_custom_input = true;
  }

  $scope.UseCustomInput = function() {
    var custom_obj = $.extend({}, $scope.object);
    custom_obj.name = custom_obj.full_name = custom_obj.prov_des
      = 'Custom Object ' + $scope.num_custom_objects;
    custom_obj.P = $scope.object.per;    // workaround for inconsistency in 3d api
    $scope.num_custom_objects++;
    pubsub.publish('UpdateRankingsWithFeaturedAsteroid', [custom_obj]);
    $scope.CloseCustomInput();
  }

  $scope.CloseCustomInput = function() {
    $scope.show_custom_input = false;
  }

  // File picker functions
  $scope.ShowFilePicker = function() {
    $scope.picking_file = true;
    filepicker.pickAndStore({
      container: 'filepicker-iframe',
      mimetype: 'image/*'
    }, function(url) {
      $scope.picking_file = false;
      console.log(url);
    }, function() {
      $scope.picking_file = false;
    });
  }
}
