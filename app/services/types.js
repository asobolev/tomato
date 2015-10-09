angular.module('services')

.factory('types', function ($rootScope) {

    var typesState = {
        types: [],  // available RDFType(s) in the actual store
        getType: function(prefix, name) {
            for (var i = 0; i < this.types.length; i++) {
                if (this.types[i].prefix === prefix && this.types[i].name === name) {
                    return this.types[i];
                }
            }
        }
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