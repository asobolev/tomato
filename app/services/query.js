module.exports = function ($rootScope) {

    function QueryState(prefixes, body) {
        this.prefixes = prefixes;
        this.body = body;
    }

    QueryState.prototype.queryToString = function() {
        return this.prefixes + this.body;
    };

    var query = new QueryState("", "");

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
};