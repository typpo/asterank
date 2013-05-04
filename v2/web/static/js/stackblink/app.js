(function() {
  angular.module('StackblinkApp', [])
    .directive('kinetic', function() {
      var kineticContainer =
        '<form class="form form-inline">'
        + '<button class="btn" ng-click="Blink()" ng-show="!blinking">Start Blink</button>'
        + '<button class="btn" ng-click="StopBlink()" ng-show="blinking">Stop Blink</button>'
        + '<span>'
        + 'Blink interval: <input type="range" min="100" max="4000" step="10" value="1000" ng-model="blink_interval" />'
        + '<span ng-bind="blink_interval"></span> ms'
        + '</span>'
        + '</form>'
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
