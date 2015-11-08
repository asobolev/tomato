var CONST = require('../components/consts');
var TomatoUtils = require('../components/utils');

module.exports = function($scope, $filter, store, query, types, info) {

    function searchMatch(haystack, needle) {
        if (!needle) {
            return true;
        }
        return haystack.toLowerCase().indexOf(needle.toLowerCase()) !== -1;
    }

    function runSPARQL(queryString, deferred, func) {
        $scope.storeState.store.execute(queryString, function (err, results) {
            var items = [];

            results.forEach(function(elem, i, arr) {
                items.push(func(elem));
            });

            deferred.resolve(items);
        });
    }

    $scope.storeState = {};
    $scope.typesState = types.types;
    $scope.items = types.types.types;
    $scope.activeType = null;
    $scope.sortingOrder = "id";
    $scope.reverse = false;
    $scope.filteredItems = [];
    $scope.queryBox = { searchText: "" };
    $scope.tree = {
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
            var couple = data.node.key.split(":");
            var selectedType = $scope.typesState.getType(couple[0], couple[1]);

            data.result = $scope.expand(selectedType);
        },

        click: function(event, data) {
            var tt = $.ui.fancytree.getEventTargetType(event.originalEvent);

            if (tt != 'expander' && data.node.folder) {
                var couple = data.node.key.split(":");
                $scope.select($scope.typesState.getType(couple[0], couple[1]));
            }
        },

        renderNode: function(event, data) { // the way to add css class to li element
            /*
             setTimeout(function () {
             $(data.node.li).addClass("list-group-item")
             }, 20);
             */
        }
    };

    /* event handlers */

    /**
     * Update selected type in the types list, if exists in the QueryState body
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
            items.push(new ResourceItem(null, $scope.items[i], false))
        }

        $scope.tree['source'] = items;
        $("#typesTree").fancytree($scope.tree);  // FIXME does not work for many updates
    });

    $scope.$on('store.update', function(event, storeState) {
        info.update("Building classes tree..");

        $scope.storeState = storeState;
        var pfxs = $scope.storeState.prefixes();
        var store = $scope.storeState.store;
        var graph = $scope.storeState.graph;

        var listClasses = new $.Deferred();

        var queryString = storeState.prefixesAsText() + RDFType.listClasses();
        runSPARQL(queryString, listClasses, function(item) {
            var parts = TomatoUtils.shrink(pfxs, item['class'].value).split(":");

            var rdfType = new RDFType(parts[0], parts[1], 0, []);

            var q1 = new $.Deferred();
            var q2 = new $.Deferred();

            var qs1 = storeState.prefixesAsText() + rdfType.listDataProperties();
            runSPARQL(qs1, q1, function(item) {
                return TomatoUtils.shrink(storeState.prefixes(), item['pred'].value);
            });

            var qs2 = storeState.prefixesAsText() + rdfType.listObjProperties();
            runSPARQL(qs2, q2, function(item) {
                return TomatoUtils.shrink(storeState.prefixes(), item['pred'].value);
            });

            $.when(q1, q2).done(function(dataProps, objProps) {
                rdfType.dataProperties = $filter('filter')(dataProps, function(predicate) {
                    return predicate != "rdf:type";
                });

                rdfType.objProperties = $filter('filter')(objProps, function(predicate) {
                    return predicate != "rdf:type";
                });
            });

            return rdfType;
        });

        listClasses.done(function(classes) {
            for (var i = 0; i < classes.length; i++) {
                var clsName = store.rdf.createNamedNode(store.rdf.resolve(classes[i].getURI()));

                classes[i].qty = graph.match(null, CONST.RDF_TYPE, clsName).toArray().length;
            }

            types.update(classes);
            info.update("Ready for requests.");
            $scope.search();
            $scope.$apply();
        });
    });

    /* user actions */

    $scope.search = function () {
        var txt = $scope.queryBox.searchText;

        $scope.filteredItems = $filter('filter')($scope.items, function (rdfType) {
            return searchMatch(rdfType.prefix, txt) || searchMatch(rdfType.name, txt);
        });
    };

    $scope.select = function (rdfType) {
        query.update($scope.storeState.prefixesAsText(), rdfType.buildSPARQL([]));
    };

    $scope.expand = function (rdfType) {
        var dfd = new $.Deferred();
        var store = $scope.storeState;
        var pfxs = store.prefixesAsText();

        var q1 = new $.Deferred();
        var q2 = new $.Deferred();
        var q3 = new $.Deferred();

        runSPARQL(pfxs + rdfType.directRelsQuery(), q1, function(item) {
            var pred = TomatoUtils.shrink(store.prefixes(), item['pred'].value);
            var both = TomatoUtils.shrink(store.prefixes(), item['objtype'].value).split(":");
            var currType = $scope.typesState.getType(both[0], both[1]);

            return new ResourceItem(pred, currType, false);
        });

        runSPARQL(pfxs + rdfType.reverseRelsQuery(), q2, function(item) {
            var pred = TomatoUtils.shrink(store.prefixes(), item['pred'].value);
            var both = TomatoUtils.shrink(store.prefixes(), item['objtype'].value).split(":");
            var currType = $scope.typesState.getType(both[0], both[1]);

            return new ResourceItem(pred, currType, true);
        });

        runSPARQL(pfxs + rdfType.listDataProperties(), q3, function(item) {
            var pred = TomatoUtils.shrink(store.prefixes(), item['pred'].value);

            return new PredicateItem(pred);
        });

        $.when(q1, q2, q3).done(function(directRels, reverseRels, dataPropeties) {
            dfd.resolve(dataPropeties.concat(directRels.concat(reverseRels)));
        });

        return dfd.promise();
    }
};
