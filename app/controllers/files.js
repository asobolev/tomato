angular.module('controllers')

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