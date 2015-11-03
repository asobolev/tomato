angular.module('controllers')

.controller('FileParser', ['$scope', '$rootScope', 'store', function($scope, $rootScope, store) {

    $scope.location = "";

    $scope.handleFileSelect = function(evt) {
        var files = evt.target.files; // FileList object

        for (var i = 0, f; f = files[i]; i++) {

            var reader = new FileReader();
            reader.onload = (function(theFile) {
                return function(e) {
                    store.update(e.target.result);
                };
            })(f);

            $scope.location = f.name;
            //localStorage.setItem("fileLocation", );
            reader.readAsText(f);
        }
    };

    document.getElementById('fileInput').addEventListener('change', $scope.handleFileSelect, false);
}]);