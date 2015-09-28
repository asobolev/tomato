angular.module('services', [])

.factory('store', function ($rootScope) {

    var store = rdfstore.create(function(err, store) {});

    var update = function (rdfData) {
        store.load("text/turtle", rdfData, function(err, results){
            $rootScope.$broadcast('store.update', store);
        });
    };

    return {
        update: update,
        store: store
    };
});