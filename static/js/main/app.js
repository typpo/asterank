(function() {
  'use strict';

  var fuzzes = [
    {
      word: 'trillion',
      num: 1000000000000
    },
    {
      word: 'billion',
      num: 1000000000
    },
    {
      word: 'million',
      num: 1000000
    }
  ];

  function toFuzz(n) {
    if (n < 0.1) {
      return 0;
    }
    for (var i=0; i < fuzzes.length; i++) {
      var x = fuzzes[i];
      if (n / x.num >= 1) {
        var prefix = (n / x.num);
        if (i==0 && prefix > 100)
          return '>100 ' + x.word;
        return prefix.toFixed(2) + ' ' + x.word;
      }
    }
    return n;
  }

  function truncateText(txt, len) {
    if (txt.length > len) {
      txt = txt.substring(0,len-3) + '...';
    }
    return txt;
  }

  function sizeContainers() {
    // top and bottom
    var $tc = $('#top-container');
    var $bc = $('#bottom-container');
    var wh = $(window).height();
    var tch = wh / 2 - $tc.offset().top - 25;
    $tc.height(tch);
    var bch = wh - $tc.height() - $tc.offset().top - 25;
    $bc.height(bch);

    // top left and top right
    var $rs = $('#right-side');
    var $ls = $('#left-side');

    var ww = $(window).width();

    // webgl view: fills bottom container, spans entire window
    $('#webgl-container').height(bch).width(ww);

    $ls.width(ww * .3);
    $rs.width(ww - $ls.width()-75);
    $rs.height(tch);
    $ls.height(tch);
    $('#results-table-container').height($ls.height() - 15);
  }
  sizeContainers();

  $(window).on('resize', function() {
    sizeContainers();
  });

  var mod = angular.module('AsterankApp', ['filters', 'ui.bootstrap', 'pasvaz.bindonce'])
    .config(function($interpolateProvider) {
        $interpolateProvider.startSymbol('[[').endSymbol(']]');
    });

  angular.module('filters',[])
    .filter('fuzzynum', function(){
      return function(num){
          return toFuzz(num)
      };
    })
    .filter('truncate', function() {
      return function(txt) {
        return truncateText(txt);
      }
    })
    .filter('ifempty', function() {
      return function(s1, s2) {
        if (!s1) return s2;
        return s1;
      }
    });

  mod.factory('pubsub', function() {
  // https://gist.github.com/floatingmonkey/3384419
    var cache = {};
    return {
      publish: function(topic, args) {
        cache[topic] && $.each(cache[topic], function() {
          this.apply(null, args || []);
        });
      },

      subscribe: function(topic, callback) {
        if(!cache[topic]) {
          cache[topic] = [];
        }
        cache[topic].push(callback);
        return [topic, callback];
      },

      unsubscribe: function(handle) {
        var t = handle[0];
        cache[t] && d.each(cache[t], function(idx){
          if(this == handle[1]){
            cache[t].splice(idx, 1);
          }
        });
      }
    }
  });

  mod.directive('autocomplete', function() {
    return {
      restrict: 'A',
      replace: true,
      transclude: true,
      template: '<div style="display:inline"><input class="input" type="text" placeholder="eg. 433 Eros" style="height:15px;font-size:12px;"/>'
          + '<div id="asteroid-lookup-suggestions"></div></div>',

      link: function($scope, element, attrs) {
        var $el = $(element).find('input');
        $el.autocomplete({
          minChars: 3,
          serviceUrl: '/api/autocomplete',
          paramName: 'query',
          transformResult: function(resp) {
            return $.map(resp, function(item) {
              return {value: item.full_name, data: item};
            });
          },
          onSelect: function(suggestion) {
            $scope.Lookup(suggestion);
          },
          appendTo: '#asteroid-lookup-suggestions'
        });
      }
    };
  });
})();
