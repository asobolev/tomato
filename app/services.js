angular.module('services', [])

.factory('store', function ($rootScope) {

    var store = rdfstore.create(function(err, store) {});

    var update = function (rdfData) {

        // FIXME rdfstore-js does not support PREFIX parsing, workaround here

        var parser = N3.Parser();
        parser.parse(rdfData, function (err, triple, prefixes) {
            if (!triple) {
                for (var prx in prefixes) {
                    if (Object.keys(store.rdf.prefixes).indexOf(prx) < 0) {
                        store.setPrefix(prx, prefixes[prx]);
                    }
                }

                store.load("text/turtle", rdfData, function(err, results){
                    $rootScope.$broadcast('store.update', store);
                });
            }
        });
    };

    return {
        update: update,
        store: store
    };
});