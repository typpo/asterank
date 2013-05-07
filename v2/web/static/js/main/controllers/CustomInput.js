function CustomInputCtrl($scope, $http, pubsub) {
  var SERIALIZED_URL_PARAM = 's';
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

  $scope.Init = function() {
    pubsub.subscribe('ShowCustomInputCtrl', function() {
      $scope.StartCustomOrbit();
    });

    $scope.$watch('object', function (oldVal, newVal) {
      // Update deeplink
      $scope.direct_url = 'http://asterank.com/?s='
        + encodeURIComponent(JSON.stringify($scope.object));
    }, true);

    // Check if there's a custom object in the url
    var serialized = getURLParameter(SERIALIZED_URL_PARAM);
    if (serialized) {
      // Insert above any new rankings
      pubsub.subscribe('InitialRankingsLoaded', function() {
        var parsed_obj = JSON.parse(decodeURIComponent(serialized));
        $scope.obj = parsed_obj;
        $scope.UseCustomInput();
      });
    }
  }

  $scope.StartCustomOrbit = function() {
    $scope.show_custom_input = true;

    // Filepicker - neccessary to initialize widget
    setTimeout(function() {
      // Unfortunately setTimeout hack is necessary because of how bootstrap
      // constructs and shows dialogs
      var element = document.getElementById('filepicker-widget')
      filepicker.constructWidget(element);
    }, 0);
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

  $scope.SaveAndUseCustomInput = function() {
    // Save on server side
    $http.post('/api/user_objects', {
      object: $scope.object,
      keys: $scope.image_keys
    }).success(function(data) {
      console.log('Object saved', data);
    });

    $scope.UseCustomInput();
  }

  $scope.CloseCustomInput = function() {
    $scope.show_custom_input = false;
  }

  $scope.OrbitLinkFocused= function() {
    // remember, jquery in angular is bad
    $('#link-orbit-container input').select();
  }

  // File picker functions
  $scope.FilepickerCallback = function(e) {
    if (!e.fpfiles) return;
    var keys = [];
    for (var i=0; i < e.fpfiles.length; i++) {
      var file = e.fpfiles[i];
      keys.push(file.key);
    }
    $scope.image_keys = keys;
  }
}
