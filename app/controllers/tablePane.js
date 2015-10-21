angular.module('controllers')

.controller('TablePane', ['$scope', '$filter', 'store', 'query', 'types',
        function($scope, $filter, store, query, types) {

    /* shared services (states) */

    $scope.storeState = store;
    $scope.queryState = query;
    $scope.typesState = types;

    /* output table data */

    $scope.headers = [];  // like ['id', 'hasNotes', ...]
    $scope.records = [];  // array of objects like {id: 'http://...', hasNotes: 'foo', ...}

    /* table sorting, search and pagination */

    $scope.sortingOrder = "";
    $scope.reverse = false;
    $scope.filteredItems = [];
    $scope.groupedItems = [];
    $scope.itemsPerPage = 7;
    $scope.pagedItems = [];
    $scope.currentPage = 0;
    $scope.queryBox = { searchText: "" };

    function TableCell(type, value, objProperties) {
        this.divUID = Math.random().toString().slice(2);
        this.type = type;  // 'uri' or 'literal'
        this.value = value;  // '45.5' or 'http://g-node.org/0.1#BrainRegion:1'
        this.objProperties = objProperties; // {'gnode:isAboutAnimal': 'gnode:Preparation', ...}

        this.hasRelations = function() {
            return Object.keys(this.objProperties).length > 0;
        }
    }

    function resolveType(graph, URI) {  // FIXME make a closure, use store to query
        var store = $scope.storeState.store;

        return graph.match(
            store.rdf.createNamedNode(URI),
            store.rdf.createNamedNode(store.rdf.resolve("rdf:type")),
            null
        ).toArray()[0].object.valueOf();
    }

    function searchMatch(haystack, needle) {
        if (!needle) {
            return true;
        }
        return haystack.toLowerCase().indexOf(needle.toLowerCase()) !== -1;
    }

    /* event handlers */

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
                        $scope.sortingOrder = $scope.headers[0];
                    }

                    var data = [];

                    for (var i = 0; i < results.length; i++) {
                        var record = {};

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

                                record[$scope.headers[j]] = cell;
                            } else {
                                record[$scope.headers[j]] = new TableCell('literal', "", {});
                            }
                        }

                        data.push(record);
                    }

                    $scope.records = data;
                    $scope.search();
                    $scope.$apply();
                });

            }
        });
    });

    /* user actions */

    $scope.selectProperty = function(tableCell, objProperty) {
        var couple = tableCell.objProperties[objProperty].split(":");
        var rdfType = $scope.typesState.getType(couple[0], couple[1]);

        var filters = ["?id " + objProperty + " <" + tableCell.value + ">"];
        var sparql = rdfType.buildSPARQL(filters);

        // FIXME optimize here: typesState.getType, prefixesToString
        var pfxs = TomatoUtils.prefixesToString($scope.storeState.prefixes);

        query.update(pfxs, sparql);
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

            var pfxs = TomatoUtils.prefixesToString($scope.storeState.prefixes);

            query.update(pfxs, sparql);

        });
    };

    /* table sorting, search and pagination */

    $scope.search = function () {

        function matchRecord(record) {
            for (var key in record) {
                if (record[key].value && searchMatch(record[key].value, txt)) {
                    return true;
                }
            }
            return false;
        }

        var txt = $scope.queryBox.searchText;

        $scope.filteredItems = $filter('filter')($scope.records, matchRecord);
        $scope.currentPage = 0;
        $scope.groupToPages();
    };

    $scope.groupToPages = function () {
        $scope.pagedItems = [];

        for (var i = 0; i < $scope.filteredItems.length; i++) {
            if (i % $scope.itemsPerPage === 0) {
                $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [ $scope.filteredItems[i] ];
            } else {
                $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.filteredItems[i]);
            }
        }
    };

    $scope.range = function (start, end) {
        var ret = [];
        if (!end) {
            end = start;
            start = 0;
        }
        for (var i = start; i < end; i++) {
            ret.push(i);
        }
        return ret;
    };

    $scope.prevPage = function () {
        if ($scope.currentPage > 0) {
            $scope.currentPage--;
        }
    };

    $scope.nextPage = function () {
        if ($scope.currentPage < $scope.pagedItems.length - 1) {
            $scope.currentPage++;
        }
    };

    $scope.setPage = function () {
        $scope.currentPage = this.n;
    };

    $scope.sort_by = function(newSortingOrder) {
        if ($scope.sortingOrder == newSortingOrder)
            $scope.reverse = !$scope.reverse;

        $scope.sortingOrder = newSortingOrder;
    };
}]);