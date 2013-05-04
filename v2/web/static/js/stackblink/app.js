(function() {
  angular.module('StackblinkApp', [])
    .directive('kinetic', function() {
      var kineticContainer =
        '<form class="form form-inline" ng-show="blinking">'
        + '<span>'
        + 'Blink interval: <input type="range" min="100" max="2000" step="10" value="1000" ng-model="blink_interval" />'
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
    })
    .directive('keyboardShortcut', function() {
      // Very simple directive for single non-special keychar binding
      return {
        restrict: 'A',
        link: function postLink(scope, iElement, iAttrs){
          jQuery(document).on('keypress', function(e){
            if (event.which == iAttrs.keyboardShortcut.charCodeAt(0)) {
              if (iAttrs.keyboardShortcutInvoke) {
                scope.$apply(iAttrs.keyboardShortcutInvoke);
              }
              else {
                scope.$apply(iAttrs.ngClick);
              }
            }
          });
        }
      };
    });
})();
