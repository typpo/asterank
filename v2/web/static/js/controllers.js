function AsteroidTableCtrl($scope, $http) {
  $scope.rankings = [];
  $scope.limit = 100;
  $scope.sort_orders = [
    {
      text: 'most cost effective',
      search_value: 'score'
    },
    {
      text: 'most valuable',
      search_value: 'value'
    },
    {
      text: 'most accessible',
      search_value: 'accessibility'
    },
    {
      text: 'upcoming passes',
      search_value: 'upcoming'
    }
  ];
  $scope.sort_by = $scope.sort_orders[0];

  $scope.UpdateRankings = function() {
    $http.get('/api/rankings?sort_by='
        + $scope.sort_by.search_value
        + '&limit=' + $scope.limit)
      .success(function(data) {
      $scope.rankings = data;
    });
  }
  $scope.UpdateRankings(); // call for the first time
}
