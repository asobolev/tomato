angular.module('controllers')

.controller('FileParser', ['$scope', 'store', function($scope, store) {

    $scope.loaded = false;

    function handleFileSelect(evt) {
        var files = evt.target.files; // FileList object

        for (var i = 0, f; f = files[i]; i++) {

            var reader = new FileReader();
            reader.onload = (function(theFile) {
                return function(e) {
                    store.update(e.target.result);

                    $scope.loaded = true;
                };
            })(f);

            reader.readAsText(f);
        }
    }

    document.getElementById('rdf_file').addEventListener('change', handleFileSelect, false);
}]);