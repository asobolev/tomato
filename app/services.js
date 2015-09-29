angular.module('services', [])

.factory('store', function ($rootScope) {

    var store = rdfstore.create(function(err, store) {});

    var update = function (rdfData) {

        function broadcast(err, results) {
            $rootScope.$broadcast('store.update', store);
        }

        function loadData() {
            store.load("text/turtle", rdfData, broadcast);
        }

        // FIXME rdfstore-js does not support PREFIX parsing, workaround here

        function loadPrefixes(err, triple, prefixes) {
            if (!triple) {
                for (var prx in prefixes) {
                    if (Object.keys(store.rdf.prefixes).indexOf(prx) < 0) {
                        store.setPrefix(prx, prefixes[prx]);
                    }
                }

                loadData();
            }
        }

        var parser = N3.Parser();
        parser.parse(rdfData, loadPrefixes);
    };

    return {
        update: update,
        store: store
    };
});