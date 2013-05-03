function KineticCtrl($scope) {
  $scope.images = [];

  $scope.stage = new Kinetic.Stage({
    container: 'container',
    width: window.innerWidth - 50,
    height: 600
  });

  $scope.drawImage = function(posx, posy, img_url) {
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

      layer.add(img);
      $scope.stage.add(layer);

      $scope.images[imageidx] = img;
    };
    imageobj.src = img_url;
  }

  $scope.Blink = function() {
    for (var i=0; i < $scope.images.length; i++) {
      $scope.images[i].hide();
    }
    var next_idx = 0;
    var next_img = function() {
      if (next_idx != 0)
        $scope.images[(next_idx-1) % $scope.images.length].hide();
      var showidx = next_idx % $scope.images.length;
      $scope.images[showidx].show();
      next_idx++;

      $scope.stage.draw();
    }

    next_img();
    $scope.blink_interval = setInterval(next_img, 1000);
  }

  $scope.Init = function() {
    $scope.drawImage(0, 0, 'http://www.asterank.com/api/skymorph/image?key=|980326052432|50898.2254861111|111.236381910219|20.0569029379104|111.46854|20.36166|20.10|32.97|-6.28|0.05|0.04|69.49|2575.44655863328|2826.62792908936|y|');
    $scope.drawImage(0, 0, 'http://www.asterank.com/api/skymorph/image?key=|980326053840|50898.2353009259|111.238841847182|20.0565244828237|111.473295|20.36019|20.10|32.99|-6.28|0.05|0.04|69.49|2581.01249388904|2824.01213461076|y|');
    $scope.drawImage(0, 0, 'http://www.asterank.com/api/skymorph/image?key=|980326055308|50898.2453472222|111.241360734472|20.0561369557589|111.468225|20.3637|20.10|33.00|-6.28|0.05|0.04|69.49|2562.63877657848|2833.382593133|y|');
  }
}
