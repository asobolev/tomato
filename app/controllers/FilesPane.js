module.exports = function($scope, $rootScope, store, info) {

    $scope.location = "";

    $scope.handleFileSelect = function(evt) {
        var files = evt.target.files; // FileList object

        for (var i = 0, f; f = files[i]; i++) {

            var reader = new FileReader();
            reader.onload = (function(theFile) {
                return function(e) {
                    store.update(e.target.result);

                    info.update("Parsing data..");
                };
            })(f);

            $scope.location = f.name;

            info.update("Loading file..");

            reader.readAsText(f);
        }
    };


    $scope.loadFromWeb = function() {
        alert('Loading from remote locations is only available ' +
            'with the server part enabled.\n\nFor the moment, you could ' +
            'manually download RDF content, save it as file and ' +
            'upload here.');

        /* TODO implement loading via HTTP on the server
        $.get($scope.location, function(data, status) {
            alert("Data: " + data.slice(0, 100) + "\nStatus: " + status);
        });
        */
    };

    document.getElementById('fileInput').addEventListener('change', $scope.handleFileSelect, false);
};