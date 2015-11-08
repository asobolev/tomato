module.exports = function($scope, query) {

    $scope.query = query;
    $scope.prefixesText = "";
    $scope.bodyText = "";

    $scope.$on('query.update', function(event, queryState) {
        $scope.query = queryState;
        $scope.prefixesText = queryState.prefixes;
        $scope.bodyText = queryState.body;
    });

    $scope.execute = function() {
        query.update($scope.prefixesText, $scope.bodyText);
    }
};