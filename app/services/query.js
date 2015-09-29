angular.module('services')

.factory('query', function ($rootScope) {

    var query = {
        prefixes: {},
        body: ""
    };

    var update = function (prefixes, body) {

        if (!(prefixes === null)) {
            query.prefixes = prefixes;
        }

        if (!(body === null)) {
            query.body = body;
        }

        $rootScope.$broadcast('query.update', query);
    };

    return {
        update: update,
        query: query
    };
});