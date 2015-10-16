angular.module('controllers')

.controller('TypesPane', ['$scope', '$filter', 'store', 'query', 'types',
        function($scope, $filter, store, query, types) {

    var searchMatch = function (haystack, needle) {
        if (!needle) {
            return true;
        }
        return haystack.toLowerCase().indexOf(needle.toLowerCase()) !== -1;
    };

    $scope.storeState = {};
    $scope.typesState = types.types;
    $scope.items = types.types.types;
    $scope.activeType = null;
    $scope.sortingOrder = "id";
    $scope.reverse = false;
    $scope.filteredItems = [];
    $scope.groupedItems = [];
    $scope.itemsPerPage = 7;
    $scope.pagedItems = [];
    $scope.currentPage = 0;
    $scope.queryBox = {
        searchText: ""
    };

    /**
     * Update selected type in the types list, if exists in the Query body
     */
    $scope.$on('query.update', function(event, queryState) {
        function contains(text, options) {
            for (var i = 0; i < options.length; i++) {
                if (text.indexOf(options[i]) > -1) {
                    return options[i];
                }
            }
            return null;
        }

        function options() {
            return ["?id a ", "?id rdf:type "];
        }

        var option = contains(queryState.body, options());
        if (option) {
            var begIndex = queryState.body.indexOf(option) + option.length;
            var rest = queryState.body.slice(begIndex);

            var couple = rest.slice(0, rest.indexOf(".")).replace(/\s+/, "").split(":");
            var rdfType = $scope.typesState.getType(couple[0], couple[1]);

            if (rdfType) {
                $scope.activeType = rdfType;
            } else {
                $scope.activeType = null;
            }

        } else {
            $scope.activeType = null;
        }
    });

    $scope.$on('types.update', function(event, typesState) {
        $scope.typesState = typesState;
        $scope.items = typesState.types;

        var curr = {};
        var items = [];
        for (var i = 0; i < $scope.items.length; i++) {
            curr = $scope.items[i];

            items.push(
                new TypeTreeItem(curr.prefix + ":" + curr.name, curr.prefix + ":" + curr.name, [])
            )
        }

        $("#typesTree").fancytree({
            source: items,
            checkbox: false,
            extensions: ["filter"],
            quicksearch: true,
            filter: {
                autoApply: true,  // Re-apply last filter if lazy data is loaded
                counter: true,  // Show a badge with number of matching child nodes near parent icons
                fuzzy: false,  // Match single characters in order, e.g. 'fb' will match 'FooBar'
                hideExpandedCounter: true,  // Hide counter badge, when parent is expanded
                highlight: true,  // Highlight matches by wrapping inside <mark> tags
                mode: "dimm"  // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
            },
            lazyLoad: function(event, data) {
                var node = data.node;

                data.result = $scope.items;
            }
        });
    });

    $scope.$on('store.update', function(event, storeState) {
        //var urisMap = new store.rdf.api.UrisMap();

        $scope.storeState = storeState;
        var store = storeState.store;

        store.graph(function(err, graph){
            var typeNode = store.rdf.createNamedNode(store.rdf.resolve("rdf:type"));
            var classes = graph.match(null, typeNode, null);

            var newList = [];
            for (var i = 0; i < classes.length; i++) {
                var URI = classes.triples[i].object.valueOf(); // class URI

                var ids = [];
                var attrs = [];

                graph.match(null, typeNode, URI).forEach(function(triple) {
                    ids.push(triple.subject.nominalValue);
                });

                var objsOfType = graph.filter(function (triple, g) {
                    return ids.indexOf(triple.subject.nominalValue) > -1;
                });
                objsOfType.forEach(function(triple, g){
                    var predicate = triple.predicate.nominalValue;
                    if (attrs.indexOf(predicate) < 0 && !(predicate == store.rdf.resolve("rdf:type"))) {
                        attrs.push(predicate);
                    }
                });
                attrs.forEach(function(elem, i, arr) { arr[i] = TomatoUtils.shrink(store.rdf.prefixes, elem) });

                var couple = TomatoUtils.split(store.rdf.prefixes, URI);
                var qty = ids.length;

                var rdfType = new RDFType(couple[0], couple[1], qty, attrs);

                if (!rdfType.isMemberOf(newList)) {
                    newList.push(rdfType);
                }
            }

            newList.sort(function(a, b) {
                return a.name.localeCompare(b.name);
            });

            types.update(newList);
            $scope.search();
            $scope.$apply();
        });
    });

    $scope.select = function(rdfType) {
        query.update($scope.storeState.prefixes, rdfType.buildSPARQL([]));
    };

    $scope.search = function () {
        var txt = $scope.queryBox.searchText;

        $scope.filteredItems = $filter('filter')($scope.items, function (rdfType) {
            return searchMatch(rdfType.prefix, txt) || searchMatch(rdfType.name, txt);
        });

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





// ------- tree


/*
 $('#typesJsTree').jstree({ 'core' : {
 'data' : [
 'Simple root node',
 {
 'text' : 'Root node 2',
 'state' : {
 'opened' : true,
 'selected' : true
 },
 'children' : [
 { 'text' : 'Child 1' },
 'Child 2'
 ]
 }
 ]
 } });
 */

/* -------------------


 var store = $scope.storeState.store;

 var URI = store.rdf.resolve(rdfType.getURI());
 var type = store.rdf.resolve("rdf:type"); // RDFModel.defaultContext.rdf
 var q1 = "SELECT DISTINCT ?s " +
 "{ ?s <" + type + "> <" + URI + "> . }";

 var q2 = "PREFIX sirota: <http://sirotalab.bio.lmu.de/ontology/0.1#> " +
 "SELECT DISTINCT * " +
 "{ ?s a sirota:Drive . " + // note a === <" + type + ">
 " OPTIONAL { ?s sirota:hasType ?t . } " +
 " OPTIONAL { ?s sirota:fullScrewTurn ?ft . }" +
 "}";

 var q3 = "PREFIX sirota: <http://sirotalab.bio.lmu.de/ontology/0.1#> " +
 "PREFIX gnode: <http://g-node.org/ontology/0.1#> " +
 "SELECT DISTINCT ?p " +
 "WHERE { " +
 " ?s a gnode:RecordingSession . " +
 " ?s ?p ?lit . " +
 " FILTER isliteral(?lit) . " +
 "}";

 var st = new rdfstore.Store({name:'test', overwrite:true}, function(err,str) {
 str.load(
 'text/n3',
 '@prefix test: <http://test.com/> .\
 test:A test:prop1 1.\
 test:B test:prop1 2.\
 test:B test:prop2 test:A.\
 test:C test:prop2 test:A.',
 function (err) {

 str.execute(
 'PREFIX test: <http://test.com/> \
 SELECT DISTINCT ?id ?p1 ?p2 \
 WHERE {\
 ?id ?p ?o .\
 OPTIONAL { ?id test:prop1 ?p1 . }\
 OPTIONAL { ?p2 test:prop2 ?id . }\
 } ORDER BY ?id', // GROUP BY is broken
 function (err, results) {
 if (!err) {
 var a = results.length;
 }
 }
 );
 });
 });


 $scope.storeState.store.execute(q3, function(err, results){
 if(!err) {
 var a = results.length;
 // results[0].s -> { token: "uri", value: "http://g-node/ont…" }
 }
 });

 */