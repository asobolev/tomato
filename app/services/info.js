angular.module('services')

.factory('info', function ($rootScope) {

    var infoString = "";

    var update = function (message) {
        infoString = message;

        $rootScope.$broadcast('info.update', infoString);
    };

    var clear = function () {
        update("");
    };

    return {
        update: update,
        clear: clear,
        info: infoString
    };
});