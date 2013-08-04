
;(function() {
    angular.module('stackblink.directives', [])
    // TODO get rid of this directive
    .directive('kinetic', function() {
      var kineticContainer =
        //'<div id="container" style="background:#818181; width: 625px; height: 454px;"></div>';
        '<div id="container" style="background:#000;"></div>';
      return {
        restrict: 'E',
        compile: function (tElement, tAttrs, transclude) {
          tElement.html(kineticContainer);
          // Link function:
          return function (scope, iElement, iAttrs, controller) {
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
