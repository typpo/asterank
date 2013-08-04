;(function() {
  angular.module('StackblinkApp', ['stackblink.directives', 'ui.bootstrap'])
    .config(function($interpolateProvider) {
        $interpolateProvider.startSymbol('[[').endSymbol(']]');
    });
})();
