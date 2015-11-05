/**
 * Class that represents an existing RDF type
 * (e.g. foaf:Person or gnode:Experiment)
 *
 */
function RDFType(prefix, name, qty, predicates) {

    this.prefix = prefix;  // short prefix, like "gnode"
    this.name = name;
    this.qty = qty;  // quantity of URIs of that type in actual store
    this.dataProperties = [];  // list of RDF data properties
    this.objProperties = [];  // list of RDF object properties
}

RDFType.prototype.compare = function(rdfType) {
    if (rdfType) {
        return (rdfType.name === this.name && rdfType.prefix === this.prefix);
    }
    return false;
};

RDFType.prototype.getURI = function() {
    return this.prefix + ":" + this.name;
};


/* SPARQL queries */


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

    for (var i = 0; i < this.dataProperties.length; i++) {
        var alias = this.dataProperties[i];
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
        where += "\t OPTIONAL { ?id " + this.dataProperties[i] + " ?" + alias + " . } \n";
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

RDFType.prototype.listDataProperties = function() {
    return "SELECT DISTINCT ?pred\
            WHERE {\
                ?id a " + this.getURI() + " .\
                ?id ?pred ?val .\
                FILTER (isliteral(?val)) .\
            } ORDER BY ?pred";
};

RDFType.prototype.listObjProperties = function() {
    return "SELECT DISTINCT ?pred\
            WHERE {\
                ?id a " + this.getURI() + " .\
                ?id ?pred ?val .\
                FILTER (!isliteral(?val)) .\
            } ORDER BY ?pred";
};
