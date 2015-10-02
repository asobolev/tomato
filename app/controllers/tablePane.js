angular.module('controllers')

.controller('TablePane', ['$scope', 'store', 'query', 'types',
        function($scope, store, query, types) {

    function TableCell(type, value, objProperties) {
        this.type = type;
        this.value = value;
        this.objProperties = objProperties;
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

        function resolveType(graph, URI) {  // returns URI of the RDF type
            var typeNode = store.rdf.createNamedNode(store.rdf.resolve("rdf:type"));

            graph.match(URI, typeNode, null).forEach(function(triple) {
                return triple.object.nominalValue;
            });
        }



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
                                var cell = new TableCell(item.token, item.value, []);

                                if (item.token == 'uri') {
                                    var rels = graph.match(null, null, item.value);

                                    rels.forEach(function(triple, g){
                                        var predURI = triple.predicate.nominalValue;

                                        if (cell.objProperties.indexOf(predURI) < 0) {
                                            cell.objProperties.push(predURI);
                                        }
                                    });
                                }

                                record.push(cell);
                            } else {
                                record.push(new TableCell('literal', "", []));
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

    $scope.selectProperty = function(tableCell) {
        //
    };
}]);



/*
            var predicate = triple.predicate.nominalValue;
            if (!(predicate in pairs)) {
                pairs[predicate] = resolveType(triple.subject.nominalValue);
            }

        }]);
*/