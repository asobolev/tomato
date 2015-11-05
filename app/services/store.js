angular.module('services')

.factory('store', function ($rootScope) {

    var storeState = {
        _prefixes: {},
        store: {},  // rdfstore Store instance
        graph: {},  // rdfstore Graph instance
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
            if (!err) {
                storeState.store.graph(function (err, graph) {
                    storeState.graph = graph;

                    $rootScope.loaded = true;
                    $rootScope.$apply();
                    $rootScope.$broadcast('store.update', storeState);
                });
            } else {
                alert(err.toString());
            }
        }

        function parseTriple(err, triple, prefixes) {
            if (!triple) {
                for (var pfx in prefixes) {
                    if (Object.keys(storeState.store.rdf.prefixes).indexOf(pfx) < 0) {
                        storeState.store.setPrefix(pfx, prefixes[pfx]);
                    }
                    storeState._prefixes[pfx] = prefixes[pfx];
                }
            }
        }

        var parser = N3.Parser();
        parser.parse(rdfData, parseTriple, function() {});

        storeState.store = rdfstore.create(function(err, store) {
            store.load("text/turtle", rdfData, broadcast)
        });
    };

    return {
        update: update,
        store: storeState
    };
});