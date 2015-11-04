angular.module('controllers')

.controller('InfoPane', ['$scope', '$rootScope', 'info', function($scope, $rootScope, info) {

    $scope.infoString = "";

    $scope.$on('info.update', function(event, message) {
        $scope.infoString = message;
        $scope.$apply();
    });

    info.update("No data loaded. Select the data source first.");
}]);