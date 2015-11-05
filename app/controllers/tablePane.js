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
        var graph = $scope.storeState.graph;
        var data = [];

        var resultsD = new $.Deferred();

        try {
            store.execute(queryState.queryToString(), function(err, results){
                if (err) {
                    resultsD.reject();
                    alert(err.toString());
                } else {
                    resultsD.resolve(results);
                }
            });
        } catch(err) { // due to a bug in rdfstore.js
            resultsD.reject();

            var msg = "The rdfstore.js is used to execute this query. " +
                    "Execution failed with the following message: \n";
            alert(msg + err.toString());
        }

        resultsD.done(function(results) {

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
                    return new TableCell('literal', "");
                }

                if (item.token == 'literal') {  // non-null Literal
                    return new TableCell(item.token, item.value);
                }

                // actual RDF Resource
                return TableCellFactory.create($scope.storeState.prefixes(), graph, item.value);
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

    $scope.selectDirectProperty = function(tableCell, objProperty) {
        var couple = tableCell.directObjProperties[objProperty].split(":");
        var rdfType = $scope.typesState.getType(couple[0], couple[1]);

        var filters = ["<" + tableCell.value + "> " + objProperty + " ?id"];

        query.update($scope.storeState.prefixesAsText(), rdfType.buildSPARQL(filters));
    };

    $scope.selectReverseProperty = function(tableCell, objProperty) {
        var couple = tableCell.reverseObjProperties[objProperty].split(":");
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