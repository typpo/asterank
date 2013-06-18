function KineticCtrl($scope, $http) {
  var DEFAULT_PADDING = 100;

  $scope.images = [];

  $scope.blinking = false;
  $scope.blink_interval = 800;
  $scope.state = 'STACKING';
  $scope.show_intro = true;
  $scope.num_images_reviewed = '?';
  $scope.email = null;

  // What we're currently showing
  var image_group_keys = [];

  $scope.stage = new Kinetic.Stage({
    container: 'container',
    width: window.innerWidth - 50,
    height: 800
  });

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
        draggable: true,
        opacity: 0.5,

        // border
        stroke: 'red',
        strokeWidth: 5,
        strokeEnabled: false
      });
      img.on('mouseover', function(e) {
        document.body.style.cursor = 'pointer';
        e.targetNode.enableStroke();
        layer.draw();
      });
      img.on('mouseout', function(e) {
        document.body.style.cursor = 'default';
        e.targetNode.disableStroke();
        layer.draw();
      });
      img.on('dragend', function(e) {
        var x = e.targetNode.getX()
        ,   y = e.targetNode.getY();
        layer.moveToTop();
        console.log('img #' + imageidx + ':', x, y);
      });

      layer.add(img);
      $scope.stage.add(layer);

      $scope.images[imageidx] = img;
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
      if (next_idx != 0)
        $scope.images[(next_idx-1) % $scope.images.length].hide();
      var showidx = next_idx % $scope.images.length;
      $scope.images[showidx].show();
      next_idx++;

      $scope.stage.draw();

      if ($scope.blinking) {
        $scope.blink_timeout = setTimeout(next_img, $scope.blink_interval);
      }
    }
    next_img();
  }

  $scope.StopBlink = function() {
    clearTimeout($scope.blink_timeout);
    for (var i=0; i < $scope.images.length; i++) {
      $scope.images[i].show();
    }
    $scope.stage.draw();
    $scope.blinking = false;
    $scope.state = 'STACKING';
  }

  $scope.BadQuality = function() {
    // NYI
    $scope.Next();
    mixpanel.track('discover action - bad quality');
  }

  $scope.Interesting = function() {
    UserResponse(true);
    mixpanel.track('discover action - interesting');
  }

  $scope.NotInteresting = function() {
    UserResponse(false);
    $scope.Next();
    mixpanel.track('discover action - not interesting');
  }

  // Records user response on server side
  function UserResponse(interesting) {
    if ($scope.NeedsEmail()) {
      $scope.PromptForEmail();
    }

    $http.post('/api/stackblink/record', {
      email: $scope.email,
      keys: image_group_keys,
      interesting: interesting
    }).success(function(data) {
      console.log(data);
      $scope.num_images_reviewed = data.images_reviewed;
    });
    $scope.Next();
  }

  $scope.Next = function() {
    $scope.Reset();
    // TODO non-control groups!
    $http.get('/api/stackblink/get_control_groups').success(function(data) {
      console.log(data);
      if (!data || !data.images) {
        alert('Sorry, communication with the server failed.');
        return;
      }

      image_group_keys = [];
      angular.forEach(data.images, function(image_info) {
        var url = 'http://asterank.com/api/skymorph/fast_image?key=' + image_info.key;
        image_group_keys.push(image_info.key);
        $scope.DrawImageWithOffset(image_info.offset_x, image_info.offset_y, url);
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

    // reset state
    $scope.blinking = false;
    $scope.state = 'STACKING';
  }

  $scope.Init = function() {
    $scope.Next();
    mixpanel.track('discover loaded');
    /*
    $scope.DrawImage(0, 0, 'http://www.asterank.com/api/skymorph/image?key=|980326052432|50898.2254861111|111.236381910219|20.0569029379104|111.46854|20.36166|20.10|32.97|-6.28|0.05|0.04|69.49|2575.44655863328|2826.62792908936|y|');
    $scope.DrawImage(0, 0, 'http://www.asterank.com/api/skymorph/image?key=|980326053840|50898.2353009259|111.238841847182|20.0565244828237|111.473295|20.36019|20.10|32.99|-6.28|0.05|0.04|69.49|2581.01249388904|2824.01213461076|y|');
    $scope.DrawImage(0, 0, 'http://www.asterank.com/api/skymorph/image?key=|980326055308|50898.2453472222|111.241360734472|20.0561369557589|111.468225|20.3637|20.10|33.00|-6.28|0.05|0.04|69.49|2562.63877657848|2833.382593133|y|');
    */
    /*
    $scope.DrawImage(0, 0, 'http://www.asterank.com/api/skymorph/image?key=|030515120812|52774.5058101852|300.473171200732|-19.1243473011823|300.016485|-19.31599|20.38|23.96|25.46|0.13|0.10|35.81|884.056345972396|1534.21375252499|y|');
    $scope.DrawImage(0, 0, 'http://www.asterank.com/api/skymorph/image?key=|030515122353|52774.5167013889|300.474927809682|-19.1224181266901|300.02529|-19.31883|20.38|23.94|25.47|0.13|0.10|35.81|901.655561971625|1521.7331666262|y|');
    $scope.DrawImage(0, 0, 'http://www.asterank.com/api/skymorph/image?key=|030515123945|52774.5277199074|300.476703412017|-19.1204663645458|300.023115|-19.31639|20.38|23.92|25.47|0.13|0.10|35.80|891.518948967416|1522.88374270101|y|');
    */
    /*
    $scope.DrawImage(0, 0, 'http://www.asterank.com/api/skymorph/image?key=|020811055100|52497.2438657407|242.345149399159|-15.9753595447791|242.00661|-15.834|19.60|22.95|-17.72|0.14|0.09|79.02|1171.68705401819|2423.16928527657|y|');
    $scope.DrawImage(0, 0, 'http://www.asterank.com/api/skymorph/image?key=|020811060632|52497.2546527778|242.346939597734|-15.9766488327123|242.011935|-15.83452|19.60|22.96|-17.72|0.14|0.09|79.03|1180.89508721214|2425.22751656948|y|');
    $scope.DrawImage(0, 0, 'http://www.asterank.com/api/skymorph/image?key=|020811062159|52497.2653819444|242.348720774806|-15.977931088641|242.00769|-15.82993|19.60|22.97|-17.72|0.14|0.09|79.03|1165.54925846943|2441.13862176737|y|');
    */
    /*
    $scope.DrawImageCascade('http://www.asterank.com/api/skymorph/image?key=|980125084345|50838.3638310185|125.205629235086|19.0000617925272|125.805075|19.38883|17.21|-120.81|19.77|0.12|0.09|-7.50|3461.14286885139|3062.18843658054|y|');
    $scope.DrawImageCascade('http://www.asterank.com/api/skymorph/image?key=|980125085746|50838.3735648148|125.19762024079|19.0012706490652|125.809365|19.38706|17.21|-120.80|19.77|0.12|0.09|-7.50|3491.20920724698|3055.32035097508|y|');
    */
  }

  $scope.HideIntro = function() {
    $scope.show_intro = false;
  }

  $scope.NeedsEmail = function() {
    return !$scope.email;
  }

  $scope.PromptForEmail = function() {
    $scope.email = prompt('Please enter your email address so we can associate any potential discoveries with your name.');
  }
}
