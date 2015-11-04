angular.module('services')

.factory('store', function ($rootScope) {

    var storeState = {
        _prefixes: {},
        store: {},
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
                $rootScope.infoString = "";

                $rootScope.loaded = true;
                $rootScope.$apply();
                $rootScope.$broadcast('store.update', storeState);
            } else {
                $rootScope.infoString = "No data loaded. Select the data source first.";

                alert(err.toString());
            }
        }

        function parsePrefix(namespace, URI) {
            if (Object.keys(storeState.store.rdf.prefixes).indexOf(namespace) < 0) {
                storeState.store.setPrefix(namespace, URI);
            }
            storeState._prefixes[namespace] = URI;
        }

        var parser = N3.Parser();
        parser.parse(rdfData, null, parsePrefix);

        storeState.store = rdfstore.create(function(err, store) {
            store.load("text/turtle", rdfData, broadcast)
        });
    };

    return {
        update: update,
        store: storeState
    };
});