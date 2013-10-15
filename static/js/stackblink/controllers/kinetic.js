function KineticCtrl($scope, $http) {
  var DEFAULT_PADDING = 0;
  var CONTROL_URL = '/api/stackblink/get_neat_control_group';
  var UNKNOWN_URL = '/api/stackblink/get_sdss_unknown_group';

  var STAGE_SDSS_WIDTH = 661;
  var STAGE_SDSS_HEIGHT = 454;
  var STAGE_NEAT_WIDTH = 500;
  var STAGE_NEAT_HEIGHT = 500;

  $scope.images = [];

  $scope.blinking = false;
  $scope.blink_interval = 800;
  $scope.state = 'INITIALIZING';
  $scope.show_intro = true;
  $scope.num_images_reviewed = '?';
  $scope.images_loaded = 0;
  $scope.email = null;

  // What we're currently showing
  var image_group_keys = [];

  // User clicks
  var circles = [];

  $scope.stage = new Kinetic.Stage({
    container: 'container',
    width: STAGE_NEAT_WIDTH,
    height: STAGE_NEAT_HEIGHT
  });

  $scope.Init = function() {
    var CIRCLE_RADIUS = 15;

    var create_circle = function(xpos, ypos) {
      var circle = new Kinetic.Circle({
        x: xpos,
        y: ypos,
        radius: CIRCLE_RADIUS,
        fill: 'none',
        stroke: 'green',
        strokeWidth: 3
      });
      var layer = new Kinetic.Layer();
      layer.add(circle);

      circles.push(layer);
      var layeridx = circles.length - 1;
      layer.on('click touchstart', function() {
        layer.remove();
        circles.splice(layeridx, 1);
      });

      $scope.stage.add(layer);
    }
    $scope.stage.on('click', function(e) {
      var mousepos = $scope.stage.getMousePosition();
      create_circle(mousepos.x, mousepos.y);
    });
    $scope.stage.on('touchstart', function(e) {
      var pos = $scope.stage.getTouchPosition();
      create_circle(pos.x, pos.y);
    });

    $scope.Next();
    mixpanel.track('discover loaded');
  }

  $scope.DrawImageWithOffset = function(offset_x, offset_y, img_url) {
    var x = DEFAULT_PADDING + offset_x
      , y = DEFAULT_PADDING + offset_y;
    return $scope.DrawImage(x, y, img_url);
  }

  $scope.DrawImageCascade = function(img_url) {
    var offset = 50 * $scope.images.length;
    return $scope.DrawImage(offset, offset, img_url);
  }

  $scope.DrawImage = function(posx, posy, img_url) {
    var imageobj = new Image();
    var imageidx = $scope.images.length;
    $scope.images.push({});
    imageobj.onload = function() {
      var layer = new Kinetic.Layer();
      var img = new Kinetic.Image({
        image: imageobj,
        x: posx,
        y: posy,
        width: 0,
        height: 0,
        draggable: false,
        opacity: 0.5,

        // border
        stroke: 'red',
        strokeWidth: 5,
        strokeEnabled: false
      });

      var frame_label = new Kinetic.Text({
        x: 5,
        y: imageobj.height - 20,
        text: 'Frame ' + (imageidx+1),
        fontSize: 15,
        fill: 'blue'
      });

      layer.add(img);
      layer.add(frame_label);
      $scope.stage.add(layer);

      $scope.$apply(function() {
        $scope.images[imageidx] = layer;
        $scope.images_loaded++;
      });
    };
    imageobj.src = img_url;
  }

  $scope.StartBlink = function() {
    $scope.blinking = true;
    $scope.state = 'BLINKING';
    for (var i=0; i < $scope.images.length; i++) {
      $scope.images[i].hide();
    }
    var next_idx = 0;
    var next_img = function() {
      if (!$scope.blinking) return;
      if (next_idx != 0) {
        $scope.images[(next_idx-1) % $scope.images.length].hide();
      }
      var showidx = next_idx % $scope.images.length;
      $scope.images[showidx].show();
      next_idx++;

      $scope.stage.draw();

      if ($scope.blink_timeout) {
        clearTimeout($scope.blink_timeout);
      }
      $scope.blink_timeout = setTimeout(next_img, $scope.blink_interval);
    }
    next_img();
  }

  $scope.StopBlink = function() {
    clearTimeout($scope.blink_timeout);
    $scope.blink_timeout = null;
    for (var i=0; i < $scope.images.length; i++) {
      $scope.images[i].show();
    }
    $scope.stage.draw();
    $scope.blinking = true;
    $scope.state = 'BLINKING';
  }

  $scope.Circled = function() {
    var interesting = circles.length > 0;
    mixpanel.track('discover action - done', {
      num_circles: circles.length
    });
    UserResponse(interesting, false);
    $scope.Next();
  }

  $scope.Interesting = function() {
    UserResponse(true, false);
    $scope.Next();
    mixpanel.track('discover action - interesting');
  }

  $scope.NotInteresting = function() {
    UserResponse(false, false);
    $scope.Next();
    mixpanel.track('discover action - not interesting');
  }

  $scope.PoorQuality = function() {
    UserResponse(false, true);
    $scope.Next();
    mixpanel.track('discover action - poor quality');
  }

  $scope.Unsure = function() {
    // TODO record unsure!
    $scope.Next();
    mixpanel.track('discover action - unsure');
  }

  // Records user response on server side
  function UserResponse(interesting, poor_quality) {
    if (interesting && $scope.NeedsEmail()) {
      $scope.PromptForEmail();
    }

    $http.post('/api/stackblink/record', {
      email: $scope.email,
      keys: image_group_keys,
      interesting: interesting,
      poor_quality: poor_quality,
      circle_coords: (function() {
        var coords = [];
        angular.forEach(circles, function(circle_layer) {
          coords.push([circle_layer.children[0].getX(), circle_layer.children[0].getY()]);
        });
        return coords;
      })()
    }).success(function(data) {
      console.log(data);
      $scope.num_images_reviewed = data.count;
    });
  }

  var group_count = 0;
  $scope.Next = function() {
    $scope.Reset();
    group_count++;
    if (group_count > 2 && Math.random() > .2) {
      $scope.stage.setWidth(STAGE_SDSS_WIDTH);
      $scope.stage.setHeight(STAGE_SDSS_HEIGHT);
      LoadNewImage(UNKNOWN_URL, '/api/sdss/image?key=');
    } else {
      $scope.stage.setWidth(STAGE_NEAT_WIDTH);
      $scope.stage.setHeight(STAGE_NEAT_HEIGHT);
      LoadNewImage(CONTROL_URL, 'http://www.asterank.com/api/skymorph/fast_image?key=');
    }
  }

  function LoadNewImage(endpoint, image_prefix) {
    // TODO non-control groups!
    $http.get(endpoint).success(function(data) {
      //console.log(data);
      if (!data || !data.images) {
        alert('Sorry, communication with the server failed.');
        return;
      }

      image_group_keys = [];
      angular.forEach(data.images, function(image_info) {
        var url = image_prefix + image_info.key;
        image_group_keys.push(image_info.key);
        $scope.DrawImageWithOffset(image_info.offset_x, image_info.offset_y, url);
      });

      var started_blink = false;
      $scope.$watch('images_loaded', function(newval, oldval) {
        // wait for all images to load
        if (newval == data.images.length && !started_blink) {
          started_blink = true;
          $scope.StartBlink();
        }
      });
    });
  }

  $scope.Reset = function() {
    // reset canvas
    if ($scope.blinking) {
      $scope.StopBlink();
    }
    $scope.stage.clear();
    angular.forEach($scope.images, function(image) {
      // necessary because kinetic.clear() doesn't actually remove each layer
      image.remove();
    });
    $scope.images = [];
    $scope.stage.draw();
    angular.forEach(circles, function(circle_layer) {
      circle_layer.remove();
    });
    circles = [];

    // reset state
    $scope.blinking = true;
    $scope.state = 'BLINKING';
    $scope.images_loaded = 0;
  }

  $scope.HideIntro = function() {
    $scope.show_intro = false;
  }

  $scope.NeedsEmail = function() {
    return !$scope.email;
  }

  $scope.PromptForEmail = function() {
    $scope.email = prompt('Please enter your email address so we can associate any potential discoveries with your name.\n\nYour email will not be used for any other purposes.');
  }
}
