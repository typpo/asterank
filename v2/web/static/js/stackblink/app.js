(function() {
  angular.module('StackblinkApp', [])
    .directive('kinetic', function() {
      var kineticContainer = '<button ng-click="Blink()">Blink</button><div id="container"></div>';
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
