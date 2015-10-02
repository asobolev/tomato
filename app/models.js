function RDFType(prefix, name, qty, predicates) {

    this.prefix = prefix;
    this.name = name;
    this.qty = qty;
    this.predicates = predicates;
}

RDFType.prototype.isMemberOf = function (lst) {
    for (var i = 0; i < lst.length; i++) {
        if (this.compare(lst[i])) {
            return true;
        }
    }
    return false;
};

RDFType.prototype.compare = function(rdfType) {
    return (rdfType.name === this.name && rdfType.prefix === this.prefix);
};

RDFType.prototype.getURI = function() {
    return this.prefix + ":" + this.name;
};

RDFType.prototype.buildSPARQL = function(filters) {  // FIXME use SPARQLJS
    var select = "SELECT DISTINCT ?id ";
    var where = "WHERE {\n" + "\t ?id a " + this.getURI() + " .\n";

    for (var i = 0; i < filters.length; i++) {
        where += "\t " + filters[i] + ". } \n";
    }

    for (var i = 0; i < this.predicates.length; i++) {
        var varName = "?t" + i;

        var alias = this.predicates[i];
        if (alias.indexOf(":") > -1) {
            alias = alias.split(":")[0] + "_" + alias.split(":")[1];
        }
        select += "(" + varName + " AS ?" + alias + ") ";
        where += "\t OPTIONAL { ?id " + this.predicates[i] + " " + varName + " . } \n";
    }
    select += "\n";
    where += "}";

    return select + where + " ORDER BY ?id";
};
