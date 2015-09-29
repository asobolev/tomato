angular.module('controllers')

.controller('TypesPane', ['$scope', 'store', 'query', function($scope, store, query) {

    function RDFType(prefix, name, qty) {

        this.prefix = prefix;
        this.name = name;
        this.qty = qty;
    }

    RDFType.prototype.compare = function(rdfType) {
        return (rdfType.name === this.name && rdfType.prefix === this.prefix);
    };

    RDFType.prototype.getURI = function() {
        return this.prefix + ":" + this.name;
    };

    function exist(lst, rdfType) {
        for (var i = 0; i < lst.length; i++) {
            var obj = lst[i];

            if (obj.compare(rdfType)) {
                return true;
            }
        }
        return false;
    }

    function split(prefixes, URI) {
        var couple = URI.split("#");
        var prefix = couple[0] + "#";
        var name = couple[1];

        for (var pfx in prefixes) {
            if (prefixes[pfx] && prefixes[pfx] === prefix) {
                return [pfx, name]
            }
        }

        return [prefix, name];
    }

    function getObjsOfType(store, typeURI) { // SPARQL example
        var query = "SELECT DISTINCT ?s " +
            "{ ?s <" + RDFModel.defaultContext.rdf +
            "type> <" + typeURI + "> . }";

        store.execute(query, function(err, results){
            if(!err) {
                // results[0].s -> { token: "uri", value: "http://g-node/ont…" }
            }
        });
    }

    $scope.storeState = {};
    $scope.typesList = [];

    $scope.$on('store.update', function(event, storeState) {
        //var urisMap = new store.rdf.api.UrisMap();

        $scope.storeState = storeState;
        var store = storeState.store;

        store.graph(function(err, graph){
            var typeNode = store.rdf.createNamedNode(store.rdf.resolve("rdf:type"));
            var classes = graph.match(null, typeNode, null);

            var newList = [];
            for (var i = 0; i < classes.length; i++) {
                var URI = classes.triples[i].object.valueOf();

                var qty = graph.match(null, typeNode, URI).length; // unique?
                var couple = split(store.rdf.prefixes, URI);

                var rdfType = new RDFType(couple[0], couple[1], qty);

                if (!exist(newList, rdfType)) {
                    newList.push(rdfType);
                }
            }

            $scope.typesList = newList;
            $scope.$apply();
        });
    });

    $scope.select = function(rdfType) {
        var body = "SELECT DISTINCT * {\n" +
            "\t ?s <rdf:type> <" + rdfType.getURI() + "> .\n" +
            "}";

        query.update($scope.storeState.prefixes, body);
    }
}]);
