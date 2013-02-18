function IntroStatementCtrl($scope, pubsub) {
  'use strict';
  $scope.show = true;

  pubsub.subscribe('HideIntroStatement', function() {
    $scope.show = false;
  });
}
