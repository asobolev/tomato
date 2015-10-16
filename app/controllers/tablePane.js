angular.module('controllers')

.controller('TablePane', ['$scope', 'store', 'query', 'types',
        function($scope, store, query, types) {

    function TableCell(type, value, objProperties) {
        this.type = type;  // 'uri' or 'literal'
        this.value = value;  // '45.5' or 'http://g-node.org/0.1#BrainRegion:1'
        this.objProperties = objProperties; // {'gnode:isAboutAnimal': 'gnode:Preparation', ...}
    }

    $scope.storeState = store;
    $scope.queryState = query;
    $scope.typesState = types;

    $scope.headers = [];
    $scope.records = [];

    $scope.$on('types.update', function (event, typesState) {
        $scope.typesState = typesState;
    });

    $scope.$on('store.update', function (event, storeState) {
        $scope.storeState = storeState;
    });

    $scope.$on('query.update', function(event, query) {

        $scope.queryState = query;
        var store = $scope.storeState.store;

        store.execute(query.queryToString(), function(err, results){
            if(!err) {
                store.graph(function (err, graph) {

                    if (results.length > 0) {
                        $scope.headers = Object.keys(results[0]);
                    }

                    var data = [];

                    for (var i = 0; i < results.length; i++) {
                        var record = [];

                        for (var j = 0; j < $scope.headers.length; j++) {
                            var item = results[i][$scope.headers[j]];

                            if (item) {
                                var cell = new TableCell(item.token, item.value, {});

                                if (item.token == 'uri') {
                                    var rels = graph.match(null, null, item.value);

                                    rels.forEach(function(triple, g){
                                        var predURI = TomatoUtils.shrink(store.rdf.prefixes,
                                            triple.predicate.nominalValue);

                                        if (!(predURI in cell.objProperties)) {
                                            cell.objProperties[predURI] = TomatoUtils.shrink(
                                                store.rdf.prefixes, resolveType(
                                                    graph, triple.subject.valueOf()));
                                        }
                                    });
                                }

                                record.push(cell);
                            } else {
                                record.push(new TableCell('literal', "", {}));
                            }
                        }

                        data.push(record);
                    }

                    $scope.records = data;
                    $scope.$apply();
                });

            }
        });
    });

    $scope.selectProperty = function(tableCell, objProperty) {
        var couple = tableCell.objProperties[objProperty].split(":");
        var rdfType = $scope.typesState.getType(couple[0], couple[1]);

        var filters = ["?id " + objProperty + " <" + tableCell.value + ">"];
        var sparql = rdfType.buildSPARQL(filters);

        query.update($scope.storeState.prefixes, sparql);
    };

    $scope.selectURI = function(tableCell) {
        var store = $scope.storeState.store;

        store.graph(function (err, graph) {

            var typeAsString = TomatoUtils.shrink(
                $scope.storeState.prefixes, resolveType(
                    graph, tableCell.value
            ));

            var couple = typeAsString.split(":");
            var rdfType = $scope.typesState.getType(couple[0], couple[1]);

            // FIXME add filter for ?id
            var filters = []; //["FILTER (?id = " + "<" + tableCell.value + ">)"];
            var sparql = rdfType.buildSPARQL(filters);

            query.update($scope.storeState.prefixes, sparql);

        });
    };

    function resolveType(graph, URI) {  // FIXME make a closure, use store to query
        var store = $scope.storeState.store;

        return graph.match(
            store.rdf.createNamedNode(URI),
            store.rdf.createNamedNode(store.rdf.resolve("rdf:type")),
            null
        ).toArray()[0].object.valueOf();
    }
}]);