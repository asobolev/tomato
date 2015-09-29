angular.module('services')

.factory('store', function ($rootScope) {

    var storeState = {
        store: rdfstore.create(function(err, store) {}),
        prefixes: {}
    };

    var update = function (rdfData) {

        function broadcast(err, results) {
            $rootScope.$broadcast('store.update', storeState);
        }

        function loadData() {
            storeState.store.load("text/turtle", rdfData, broadcast);
        }

        // FIXME rdfstore-js does not support PREFIX parsing, workaround here

        function loadPrefixes(err, triple, prefixes) {
            if (!triple) {
                storeState.prefixes = prefixes;

                for (var prx in prefixes) {
                    if (Object.keys(storeState.store.rdf.prefixes).indexOf(prx) < 0) {
                        storeState.store.setPrefix(prx, prefixes[prx]);
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
        store: storeState
    };
});