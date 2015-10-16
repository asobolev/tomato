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

    // implements fancytree::Node interface
    this.key = prefix + ":" + name;
    this.title = prefix + ":" + name;
    this.children = [];
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

RDFType.prototype.buildSPARQL = function(filters) {  // TODO use SPARQLJS
    var select = "SELECT DISTINCT ?id ";
    var where = "WHERE {\n" + "\t ?id a " + this.getURI() + " .\n";
    var aliases = [];

    for (var i = 0; i < filters.length; i++) {
        where += "\t " + filters[i] + " . \n";
    }

    for (var i = 0; i < this.predicates.length; i++) {
        var varName = "?t" + i;

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
        select += "(" + varName + " AS ?" + alias + ") ";
        where += "\t OPTIONAL { ?id " + this.predicates[i] + " " + varName + " . } \n";
    }
    select += "\n";
    where += "}";

    return select + where + " ORDER BY ?id";
};



/**
 * Class that represents an item in the RDF types tree
 *
 */
function TypeTreeItem(key, title, children) {

    this.key = key;
    this.title = title;
    this.children = children;

    this.folder = true;
    this.lazy = true;
}

TypeTreeItem.prototype.isMemberOf = function (lst) {
    for (var i = 0; i < lst.length; i++) {
        if (this.compare(lst[i])) {
            return true;
        }
    }
    return false;
};


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

TomatoUtils.resolveType = function(graph, URI) {  // returns URI of the RDF type
    var typeNode = store.rdf.createNamedNode(store.rdf.resolve("rdf:type"));

    graph.match(URI, typeNode, null).forEach(function(triple) {
        return triple.object.nominalValue;
    });
};