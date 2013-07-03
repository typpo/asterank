(function() {
  angular.module('StackblinkApp', ['ui.bootstrap'])
    .config(function($interpolateProvider) {
        $interpolateProvider.startSymbol('[[').endSymbol(']]');
    })
    .directive('kinetic', function() {
      var kineticContainer =
        '<div id="container" style="background:#818181; width:500px; height:500px"></div>';
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
