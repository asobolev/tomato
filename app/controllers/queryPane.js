angular.module('controllers')

.controller('QueryPane', ['$scope', 'query', function($scope, query) {

    $scope.query = query;
    $scope.prefixesText = "";
    $scope.bodyText = "";

    $scope.$on('query.update', function(event, query) {
        $scope.query = query;
        $scope.prefixesText = query.prefixesToString();
        $scope.bodyText = query.body;
    });

    $scope.execute = function() {
        // update query state
    }
}]);