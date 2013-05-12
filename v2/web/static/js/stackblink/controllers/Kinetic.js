function KineticCtrl($scope, $http) {
  var DEFAULT_PADDING = 100;

  $scope.images = [];
  $scope.blinking = false;
  $scope.blink_interval = 800;
  $scope.state = 'STACKING';
  $scope.show_intro = true;

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
    // TODO report
    $scope.Next();
  }

  $scope.Interesting = function() {
    // TODO report
    $scope.Next();
  }

  $scope.NotInteresting = function() {
    // TODO report
    $scope.Next();
  }

  $scope.Next = function() {
    $scope.Reset();
    $http.get('/api/stackblink/get_control_groups').success(function(data) {
      console.log(data);
      if (!data || !data.images) {
        alert('Sorry, communication with the server failed.');
        return;
      }

      if (data.reviews.length < 1) {
        var k1 = data.images[0].key.split('|');
        var k2 = data.images[1].key.split('|');

        var x1 = parseFloat(k1[12]);
        var x2 = parseFloat(k2[12]);
        var y1 = parseFloat(k1[13]);
        var y2 = parseFloat(k2[13]);

        var dx = x1 - x2;
        var dy = y1 - y2;

        // For our purposes,
        // ra = x
        // dec = y

        /*
         // center ra and dec
        var dec1 = parseFloat(k1[5]);
        var dec2 = parseFloat(k2[5]);
        var ra1 = parseFloat(k1[6]);
        var ra2 = parseFloat(k2[6]);
        */
        // predicted ra and dec?
        var dec1 = parseFloat(k1[4]);
        var dec2 = parseFloat(k2[4]);
        var ra1 = parseFloat(k1[3]);
        var ra2 = parseFloat(k2[3]);

        console.log('ra1', ra1);
        console.log('dec1', dec1);
        //var diff_in_center_x = data.images[0].center_ra - data.images[1].center_ra;
        //var diff_in_center_y = data.images[0].center_dec - data.images[1].center_dec;
        var diff_in_ra= ra1-ra2;
        // RA correction for declination
        var pi = Math.PI;
        diff_in_ra = diff_in_ra * Math.cos((dec1+dec2)/2*pi/180) * 180/pi;
        var diff_in_dec = dec1-dec2;

        console.log('ra delta', ra1-ra2);
        console.log('ra diff (arcsec)', diff_in_ra*3600);
        console.log('dec diff (arcsec)', diff_in_dec*3600);
        console.log('x diff', dx);
        console.log('y diff', dy);
        console.log(data.images[1].time);

        var x_pixels_per_degree = dx / diff_in_ra;
        var y_pixels_per_degree = dy / diff_in_dec;

        console.log('x pixels per arcsec:', x_pixels_per_degree/3600);
        console.log('y pixels per arcsec:', y_pixels_per_degree/3600);

        var offset_x = diff_in_ra * x_pixels_per_degree;  // degrees to arcsec to pixels
        var offset_y = diff_in_dec * y_pixels_per_degree;  // degrees to arcsec to pixels
        console.log('offset x', offset_x);
        console.log('offset y', offset_y);

      }

      angular.forEach(data.images, function(image_info) {
        var url = 'http://asterank.com/api/skymorph/fast_image?key=' + image_info.key;
        /*
        if (data.reviews.length < 1) {
          $scope.DrawImageCascade(url);
        }
        else {
          alert('this should not happen yet');
          $scope.DrawImage(image_info.pos_x, image_info.pos_y, url);
        }
        */
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
    mixpanel.track('discover');
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
}
