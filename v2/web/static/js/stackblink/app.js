(function() {
  angular.module('StackblinkApp', [])
    .directive('kinetic', function() {
      var kineticContainer =
        '<button class="btn" ng-click="Blink()" ng-show="!blinking">Start Blink</button>'
        + '<button class="btn" ng-click="StopBlink()" ng-show="blinking">Stop Blink</button>'
        + '<div id="container"></div>';
      return {
        restrict: 'E',
        compile: function (tElement, tAttrs, transclude) {
          tElement.html(kineticContainer);
          // Link function:
          return function (scope, iElement, iAttrs, controller) {
            scope.Init();
          };
        },
        controller: KineticCtrl
      };
  });
})();
