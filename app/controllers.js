angular.module('controllers', ['services'])

.controller('TypesList', ['$scope', 'store', function($scope, store) {

    function exist(lst, prefix, name) {
        for (var i = 0; i < lst.length; i++) {
            var obj = lst[i];

            if (obj.name === name && obj.prefix === prefix) {
                return true;
            }
        }
        return false;
    }

    $scope.typesList = [];

    $scope.$on('store.update', function(event, store, graph) {
        var typeNode = store.rdf.createNamedNode(store.rdf.resolve("rdf:type"));
        var classes = graph.match(null, typeNode, null);

        var newList = [];
        for (var i = 0; i < classes.length; i++) {
            var name = classes.triples[i].object.valueOf();
            var prefix = 'gnode';

            if (!exist(newList, prefix, name)) {
                // fetch qty

                newList.push({
                    prefix: prefix,
                    name: name,
                    qty: 0
                });
            }
        }

        $scope.typesList = newList;
        $scope.$apply();

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


