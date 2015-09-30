angular.module('services')

.factory('query', function ($rootScope) {

    function QueryState(prefixes, body) {
        this.prefixes = prefixes;
        this.body = body;
    }

    QueryState.prototype.prefixesToString = function() {
        var pfxText = "";
        for (var pfx in this.prefixes) {
            if (this.prefixes[pfx]) {
                pfxText += "PREFIX " + pfx + ": <" + this.prefixes[pfx] + ">\n"; // "&#13;&#10;";
            }
        }

        return pfxText;
    };

    QueryState.prototype.queryToString = function() {
        return this.prefixesToString() + this.body;
    };

    var query = new QueryState({}, "");

    var update = function (prefixes, body) {

        if (!(prefixes === null)) {
            query.prefixes = prefixes;
        }

        if (!(body === null)) {
            query.body = body;
        }

        $rootScope.$broadcast('query.update', query);
    };

    return {
        update: update,
        query: query
    };
});