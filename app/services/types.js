angular.module('services')

.factory('types', function ($rootScope) {

    var typesState = {
        types: []  // object of RDFType
    };

    var update = function (newTypes) {
        typesState.types = newTypes;

        $rootScope.$broadcast('types.update', typesState);
    };

    return {
        update: update,
        types: typesState
    };
});