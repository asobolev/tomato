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
    $scope.queryBox = { searchText: "" };

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

        var items = [];
        for (var i = 0; i < $scope.items.length; i++) {
            items.push(new TypeTreeItem(null, $scope.items[i], false))
        }

        var pfxs = TomatoUtils.prefixesToString($scope.storeState.prefixes);

        $("#typesTree").fancytree({
            source: items,
            checkbox: false,
            extensions: ["filter"],
            quicksearch: true,
            icons: false, // Display node icons
            filter: {
                autoApply: true,  // Re-apply last filter if lazy data is loaded
                counter: true,  // Show a badge with number of matching child nodes near parent icons
                fuzzy: false,  // Match single characters in order, e.g. 'fb' will match 'FooBar'
                hideExpandedCounter: true,  // Hide counter badge, when parent is expanded
                highlight: true,  // Highlight matches by wrapping inside <mark> tags
                mode: "dimm"  // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
            },
            lazyLoad: function(event, data) {
                var dfd = new $.Deferred();
                data.result = dfd.promise();

                var store = $scope.storeState.store;
                var couple = data.node.key.split(":");
                var selectedType = $scope.typesState.getType(couple[0], couple[1]);

                var directQuery = pfxs + selectedType.directRelsQuery();
                var reverseQuery = pfxs + selectedType.reverseRelsQuery();

                var q1 = new $.Deferred();
                var q2 = new $.Deferred();

                store.execute(directQuery, function (err, results) {
                        var children = [];
                        for (var i = 0; i < results.length; i++) {
                            var pred = TomatoUtils.shrink(store.rdf.prefixes, results[i]['pred'].value);
                            var both = TomatoUtils.shrink(store.rdf.prefixes, results[i]['objtype'].value).split(":");
                            var currType = $scope.typesState.getType(both[0], both[1]);

                            children.push(new TypeTreeItem(pred, currType, false));
                        }
                        q1.resolve(children);
                    }
                );

                store.execute(reverseQuery, function (err, results) {
                        var children = [];
                        for (var i = 0; i < results.length; i++) {
                            var pred = TomatoUtils.shrink(store.rdf.prefixes, results[i]['pred'].value);
                            var both = TomatoUtils.shrink(store.rdf.prefixes, results[i]['objtype'].value).split(":");
                            var currType = $scope.typesState.getType(both[0], both[1]);

                            children.push(new TypeTreeItem(pred, currType, true));
                        }
                        q2.resolve(children);
                    }
                );

                $.when(q1, q2).done(function(directRels, reverseRels) {
                    dfd.resolve(directRels.concat(reverseRels));
                });
            },
            click: function(event, data) {
                tt = $.ui.fancytree.getEventTargetType(event.originalEvent);

                if (tt != 'expander') {
                    var couple = data.node.key.split(":");
                    var selectedType = $scope.typesState.getType(couple[0], couple[1]);

                    query.update(pfxs, selectedType.buildSPARQL([]));
                }
            },

            // the way to add css class to li element
            renderNode: function(event, data) {
                /*
                setTimeout(function () {
                    $(data.node.li).addClass("list-group-item")
                }, 20);
                */
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
        var pfxs = TomatoUtils.prefixesToString($scope.storeState.prefixes);

        query.update(pfxs, rdfType.buildSPARQL([]));
    };

    $scope.search = function () {
        var txt = $scope.queryBox.searchText;

        $scope.filteredItems = $filter('filter')($scope.items, function (rdfType) {
            return searchMatch(rdfType.prefix, txt) || searchMatch(rdfType.name, txt);
        });
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