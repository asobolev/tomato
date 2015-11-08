module.exports = function($scope, info) {

    $scope.infoString = "No data loaded. Select the data source first.";

    $scope.$on('info.update', function(event, message) {
        $scope.infoString = message;
        $scope.$apply();
    });

};