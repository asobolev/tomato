var CONST = require('../components/consts');
var TomatoUtils = require('../components/utils');


/**
 * Class that represents single cell of the query results table
 *
 */
function TableCell(type, value) {
    this.divUID = Math.random().toString().slice(2);  // random UID
    this.rdfType = type;  // 'literal' or actual type like 'http://xmlns.com/foaf/0.1/Person'
    this.value = value;  // '45.5' or 'http://g-node.org/0.1#BrainRegion:1'
    this.directObjProperties = {}; // {'gnode:isAboutAnimal': 'gnode:Preparation', ...}
    this.reverseObjProperties = {}; // {'gnode:isAboutAnimal': 'gnode:Preparation', ...}

    this.hasRelations = function() {
        return Object.keys(this.directObjProperties).length > 0 || Object.keys(this.reverseObjProperties).length > 0;
    }
}


/**
 * Factory to create cells from Resource URIs
 *
 */
function TableCellFactory() {}

TableCellFactory.create = function(pfxs, graph, resourceURI) {

    function resolveType(URI) {
        var result = graph.match(URI, CONST.RDF_TYPE, null).toArray();

        return result.length > 0 ? result[0].object.valueOf() : null;
    }

    function buildIndex(relations, reverse) {
        var results = {};

        relations.forEach(function(triple, g) {
            var predURI = TomatoUtils.shrink(pfxs, triple.predicate.valueOf());

            if (!(predURI in results)) {
                var predType = resolveType(reverse ? triple.subject.valueOf() : triple.object.valueOf());

                if (predType != null) {
                    results[predURI] = TomatoUtils.shrink(pfxs, predType);
                }
            }
        });

        return results;
    }

    function getDirectProperties() {
        var relations = graph.match(resourceURI, null, null).filter(function(triple) {
            return triple.object.interfaceName != "Literal" &&
                triple.predicate.valueOf() != CONST.RDF_TYPE;
        });

        return buildIndex(relations, false);
    }

    function getReverseProperties() {
        var relations = graph.match(null, null, resourceURI).filter(function(triple) {
            return triple.predicate.valueOf() != CONST.RDF_TYPE;
        });

        return buildIndex(relations, true);
    }

    var cell = new TableCell(resolveType(resourceURI), resourceURI);

    cell.directObjProperties = getDirectProperties(resourceURI, false);
    cell.reverseObjProperties = getReverseProperties(resourceURI, true);

    return cell;
};


module.exports.TableCell = TableCell;
module.exports.TableCellFactory = TableCellFactory;