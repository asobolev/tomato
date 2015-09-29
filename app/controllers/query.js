angular.module('controllers')

.controller('QueryPane', ['$scope', 'query', function($scope, query) {

    $scope.query = query;
    $scope.prefixesText = "";
    $scope.bodyText = "";

    $scope.$on('query.update', function(event, query) {

        var pfxText = "PREFIX\n";
        for (var pfx in query.prefixes) {
            if (query.prefixes[pfx]) {
                pfxText += pfx + ": " + query.prefixes[pfx] + "\n"; // "&#13;&#10;";
            }
        }

        $scope.query = query;
        $scope.prefixesText = pfxText;
        $scope.bodyText = query.body;

        //$scope.$apply();
    });

    $scope.execute = function() {
        // update query state
    }
}]);