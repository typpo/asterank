(function() {
  angular.module('StackblinkApp', [])
    .directive('kinetic', function() {
      var kineticContainer =
        '<div id="container"></div>';
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
