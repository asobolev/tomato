angular.module('services', [])

.factory('store', function ($rootScope) {

    var store = rdfstore.create(function(err, store) {});
    var graph = store.rdf.createGraph();

    var update = function (rdfData) {
        store.load("text/turtle", rdfData, function(err, results){
            store.graph(function(err, newGraph){
                graph = newGraph;

                $rootScope.$broadcast('store.update', store, graph);
            });
        });
    };

    return {
        update: update,
        store: store,
        graph: graph
    };
});