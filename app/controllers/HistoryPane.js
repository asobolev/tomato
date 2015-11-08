module.exports = function($scope, query) {

    function HistoryItem(prefixes, body) {
        this.timestamp = new Date();
        this.prefixes = prefixes;
        this.body = body;
    }

    $scope.history = [];  // holds HistoryItem objects
    $scope.freeze = false;  // used to prevent history update on select

    $scope.$on('query.update', function(event, queryState) {
        if (!$scope.freeze) {
            $scope.history.splice(0, 0, new HistoryItem(queryState.prefixes, queryState.body));
        } else {
            $scope.freeze = false;
        }
    });

    $scope.select = function(historyItem) {
        $scope.freeze = true;

        query.update(historyItem.prefixes, historyItem.body);
    };
};