angular.module('controllers')

.controller('TablePane', ['$scope', 'store', 'query', function($scope, store, query) {

    $scope.queryState = {};
    $scope.storeState = {};

    $scope.headers = [];
    $scope.data = [];

    $scope.$on('store.update', function(event, storeState) {
        $scope.storeState = storeState;
    });

    $scope.$on('query.update', function(event, query) {

        $scope.queryState = query;

        $scope.storeState.store.execute(query.queryToString(), function(err, results){
            if(!err) {
                if (results.length > 0) {
                    $scope.headers = Object.keys(results[0]);
                }

                var data = [];
                for (var i = 0; i < results.length; i++) {
                    var record = [];

                    for (var j = 0; j < $scope.headers.length; j++) {
                        record.push(results[i][$scope.headers[j]].value);
                    }

                    data.push(record);
                }

                $scope.data = data;
                $scope.$apply();
            }
        });
    });

}]);