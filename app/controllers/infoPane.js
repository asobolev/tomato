angular.module('controllers')

.controller('InfoPane', ['$scope', '$rootScope', 'info', function($scope, $rootScope, info) {

    $scope.infoString = "No data loaded. Select the data source first.";

    $scope.$on('info.update', function(event, message) {
        $scope.infoString = message;
        $scope.$apply();
    });

}]);