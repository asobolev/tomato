/**
 * Class that represents an existing RDF type
 * (e.g. foaf:Person or gnode:Experiment)
 *
 */
function RDFType(prefix, name, qty, predicates) {

    this.prefix = prefix;  // short prefix, like "gnode"
    this.name = name;
    this.qty = qty;  // quantity of URIs of that type in actual store
    this.predicates = predicates;  // predicates for that type in actual store
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
    if (rdfType) {
        return (rdfType.name === this.name && rdfType.prefix === this.prefix);
    }
    return false;
};

RDFType.prototype.getURI = function() {
    return this.prefix + ":" + this.name;
};

/* SPARQL query section */

RDFType.prototype.directRelsQuery = function() {
    return "SELECT DISTINCT ?pred ?objtype\
            WHERE {\
                ?id a " + this.getURI() + " .\
                ?id ?pred ?obj .\
                ?obj a ?objtype .\
            } ORDER BY ?pred";
};

RDFType.prototype.reverseRelsQuery = function() {
    return "SELECT DISTINCT ?pred ?objtype\
            WHERE {\
                ?id a " + this.getURI() + " .\
                ?subj ?pred ?id .\
                ?subj a ?objtype .\
            } ORDER BY ?pred";
};

RDFType.prototype.buildSPARQL = function(filters) {  // TODO use SPARQLJS
    var select = "SELECT DISTINCT (?id AS ?" + this.name + "_id)";
    var where = "WHERE {\n" + "\t ?id a " + this.getURI() + " .\n";
    var aliases = [];

    for (var i = 0; i < filters.length; i++) {
        where += "\t " + filters[i] + " . \n";
    }

    for (var i = 0; i < this.predicates.length; i++) {
        var alias = this.predicates[i];
        if (alias.indexOf(":") > -1) {
            var parts = alias.split(":");
            
            if (aliases.indexOf(parts[1]) > -1) {
                alias = parts[0] + "_" + parts[1];
            } else {
                alias = parts[1];
                aliases.push(parts[1]);
            }
        }
        select += " ?" + alias;
        where += "\t OPTIONAL { ?id " + this.predicates[i] + " ?" + alias + " . } \n";
    }
    select += "\n";
    where += "}";

    return select + where + " ORDER BY ?id";
};

RDFType.listClasses = function() {
    return "SELECT DISTINCT ?class\
            WHERE {\
                ?id a ?class .\
            } ORDER BY ?class";
};

RDFType.prototype.listPredicates = function() {
    return "SELECT DISTINCT ?pred\
            WHERE {\
                ?id a " + this.getURI() + " .\
                ?id ?pred ?val .\
            } ORDER BY ?pred";
};


/**
 * Class that represents an item in the RDF types tree
 *
 */
function TypeTreeItem(predicate, rdfType, reverse) {

    var badge = '<span class="badge">' + rdfType.qty + '</span>\t ';
    var arrow = '<span class="glyphicon glyphicon-arrow-' + (reverse ? "left" : "right") + '" aria-hidden="true"></span>';
    var pre = predicate == null ? "" : '<small>' + predicate.split(":")[0] + ':</small>' + predicate.split(":")[1];
    var post = '<small>' + rdfType.prefix + ':</small>' + rdfType.name;

    this.key = rdfType.getURI();
    this.title = badge + (pre == "" ? "" : pre + " " + arrow + " ") + post;
    this.folder = true;
    this.lazy = true;
    this.extraClasses = "typesCustom";
}


/**
 * Static class with common utility functions.
 */
function TomatoUtils() {}

TomatoUtils.split = function(prefixes, URI) {
    var couple = URI.split("#");
    var prefix = couple[0] + "#";
    var name = couple[1];

    for (var pfx in prefixes) {
        if (prefixes[pfx] && prefixes[pfx] === prefix) {
            return [pfx, name]
        }
    }

    return [prefix, name];
};

TomatoUtils.shrink = function(prefixes, URI) {
    var both = TomatoUtils.split(prefixes, URI);
    return both[0] + ":" + both[1];
};