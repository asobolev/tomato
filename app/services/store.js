angular.module('services')

.factory('store', function ($rootScope) {

    var storeState = {
        _prefixes: {},
        store: rdfstore.create(function(err, store) {}),
        prefixes: function() {
            return this._prefixes;
        },
        prefixesAsText: function() {
            var pfxText = "";
            var prefixes = this.prefixes();

            for (var pfx in prefixes) {
                if (prefixes[pfx]) {
                    pfxText += "PREFIX " + pfx + ": <" + prefixes[pfx] + "> \n"; // "&#13;&#10;";
                }
            }

            return pfxText;
        }
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
            storeState._prefixes = prefixes;

            if (!triple) {
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