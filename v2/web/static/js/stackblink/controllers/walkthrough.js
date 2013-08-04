function WalkthroughCtrl($scope, $http) {
  $scope.opts = {
    backdropFade: true,
    dialogFade: true
  };

  $scope.state = 'intro';
  $scope.show_walkthrough = true;

  $scope.Close = function() {
    $scope.show_walkthrough = false;
  }

  $scope.SeeAnExample = function() {
    $scope.state = 'example';
  }
}
