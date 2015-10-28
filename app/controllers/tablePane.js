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
        this.rdfType = type;  // 'literal' or RDFType object
        this.value = value;  // '45.5' or 'http://g-node.org/0.1#BrainRegion:1'
        this.objProperties = objProperties; // {'gnode:isAboutAnimal': 'gnode:Preparation', ...}

        this.hasRelations = function() {
            return Object.keys(this.objProperties).length > 0;
        }
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

    $scope.$on('query.update', function(event, queryState) {

        $scope.queryState = queryState;
        var store = $scope.storeState.store;
        var pfxs = $scope.storeState.prefixes();
        var data = [];

        var resultsD = new $.Deferred();
        var graphD = new $.Deferred();

        store.execute(queryState.queryToString(), function(err, results){
            resultsD.resolve(results);
        });

        store.graph(function (err, graph) {
            graphD.resolve(graph);
        });

        $.when(resultsD, graphD).done(function(results, graph) {

            function resolveType(URI) {
                var store = $scope.storeState.store;

                var result = graph.match(
                    store.rdf.createNamedNode(URI),
                    store.rdf.createNamedNode(store.rdf.resolve("rdf:type")),
                    null
                ).toArray();

                return result.length > 0 ? result[0].object.valueOf() : null;
            }

            function parseRecord(sparqlResultsRecord) {
                var record = {};
                for (var j = 0; j < $scope.headers.length; j++) {
                    var item = sparqlResultsRecord[$scope.headers[j]];

                    record[$scope.headers[j]] = parseCell(item);
                }

                return record;
            }

            function parseCell(sparqlResultsValue) {
                var item = sparqlResultsValue;

                if (!item) {  // null Literal
                    return new TableCell('literal', "", {});
                }

                if (item.token == 'literal') {  // non-null Literal
                    return new TableCell(item.token, item.value, {});
                }

                // actual RDF Resource
                var cell = new TableCell(resolveType(item.value), item.value, {});
                var relations = graph.match(null, null, item.value);

                relations.forEach(function(triple, g){
                    var predURI = TomatoUtils.shrink(pfxs, triple.predicate.valueOf());

                    if (!(predURI in cell.objProperties)) {
                        var predType = resolveType(triple.subject.valueOf());

                        if (predType != null) {
                            cell.objProperties[predURI] = TomatoUtils.shrink(pfxs,predType);
                        }
                    }
                });

                return cell;
            }

            if (results.length > 0) {
                $scope.headers = Object.keys(results[0]);
                $scope.sortingOrder = $scope.headers[0];
            }

            for (var i = 0; i < results.length; i++) {
                data.push(parseRecord(results[i]));
            }

            $scope.records = data;
            $scope.search();
            $scope.$apply();
        });
    });

    /* user actions */

    $scope.selectProperty = function(tableCell, objProperty) {
        var couple = tableCell.objProperties[objProperty].split(":");
        var rdfType = $scope.typesState.getType(couple[0], couple[1]);

        var filters = ["?id " + objProperty + " <" + tableCell.value + ">"];

        query.update($scope.storeState.prefixesAsText(), rdfType.buildSPARQL(filters));
    };

    $scope.selectURI = function(tableCell) {
        if (!(tableCell.rdfType == 'literal')) {
            var parts = TomatoUtils.split($scope.storeState.prefixes(), tableCell.rdfType);
            var rdfType = $scope.typesState.getType(parts[0], parts[1]);

            query.update($scope.storeState.prefixesAsText(), rdfType.buildSPARQL([]));

            // TODO make it inside SPARQL when supported
            //$scope.queryBox.searchText = tableCell.value;
        }
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