angular.module('controllers')

.controller('TypesPane', ['$scope', 'store', 'query', function($scope, store, query) {

    function RDFType(prefix, name, qty, predicates) {

        this.prefix = prefix;
        this.name = name;
        this.qty = qty;
        this.predicates = predicates;
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

    function shrink(prefixes, URI) {
        var both = split(prefixes, URI);
        return both[0] + ":" + both[1];
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
                attrs.forEach(function(elem, i, arr) { arr[i] = shrink(store.rdf.prefixes, elem) });

                var couple = split(store.rdf.prefixes, URI);
                var qty = ids.length;

                var rdfType = new RDFType(couple[0], couple[1], qty, attrs);

                if (!exist(newList, rdfType)) {
                    newList.push(rdfType);
                }
            }

            newList.sort(function(a, b) {
                return a.name.localeCompare(b.name);
            });

            $scope.typesList = newList;
            $scope.$apply();
        });
    });

    $scope.select = function(rdfType) {

        var select = "SELECT DISTINCT ?id ";
        var where = "WHERE {\n" + "\t ?id a " + rdfType.getURI() + " .\n";
        for (var i = 0; i < rdfType.predicates.length; i++) {
            var varName = "?t" + i;

            var alias = rdfType.predicates[i];
            if (alias.indexOf(":") > -1) {
                alias = alias.split(":")[0] + "_" + alias.split(":")[1];
            }
            select += "(" + varName + " AS ?" + alias + ") ";
            where += "\t OPTIONAL { ?id " + rdfType.predicates[i] + " " + varName + " . } \n";
        }
        select += "\n";
        where += "}";

        var body = select + where + " ORDER BY ?id";

        query.update($scope.storeState.prefixes, body);


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
    };

}]);
