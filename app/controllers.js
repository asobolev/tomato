angular.module('controllers', ['services'])

.controller('TypesList', ['$scope', 'store', function($scope, store) {

    function RDFType(prefix, name, qty) {

        this.prefix = prefix;
        this.name = name;
        this.qty = qty;
    }

    RDFType.prototype.compare = function(rdfType) {
        return (rdfType.name === this.name && rdfType.prefix === this.prefix);
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
            if (prefixes.hasOwnProperty(pfx) && prefixes[pfx] === prefix) {
                return [pfx, name]
            }
        }

        return [prefix, name];
    }

    $scope.typesList = [];

    $scope.$on('store.update', function(event, store) {
        var urisMap = new store.rdf.api.UrisMap();

        store.graph(function(err, graph){
            var typeNode = store.rdf.createNamedNode(store.rdf.resolve("rdf:type"));
            var classes = graph.match(null, typeNode, null);

            var newList = [];
            for (var i = 0; i < classes.length; i++) {
                var couple = split(store.rdf.prefixes, classes.triples[i].object.valueOf());

                // fetch qty
                var rdfType = new RDFType(couple[0], couple[1], 0);

                if (!exist(newList, rdfType)) {
                    newList.push(rdfType);
                }
            }

            $scope.typesList = newList;
            $scope.$apply();
        });

        /*  alternative is to query via SPAQRL:

        var query = "SELECT DISTINCT ?o { ?s <" + RDFModel.defaultContext.rdf + "type> ?o . }";
        store.execute(query, function(err, results){
            if(!err) {
                // process results
            }
        });
        */
    });
}])

.controller('FileParser', ['$scope', 'store', function($scope, store) {

    function handleFileSelect(evt) {
        var files = evt.target.files; // FileList object

        for (var i = 0, f; f = files[i]; i++) {

            var reader = new FileReader();
            reader.onload = (function(theFile) {
                return function(e) {
                    store.update(e.target.result);
                };
            })(f);

            reader.readAsText(f);
        }
    }

    document.getElementById('rdf_file').addEventListener('change', handleFileSelect, false);
}]);


