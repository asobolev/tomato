/**
 * Static class with common utility functions.
 */
function CONST() {}

// constants
CONST.XSD_BOOLEAN = 'http://www.w3.org/2001/XMLSchema#boolean';
CONST.XSD_DOUBLE = 'http://www.w3.org/2001/XMLSchema#double';
CONST.XSD_INTEGER = 'http://www.w3.org/2001/XMLSchema#integer';
CONST.XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string';

CONST.RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
CONST.RDF_LIST = CONST.RDF + 'List';
CONST.RDF_FIRST = CONST.RDF + 'first';
CONST.RDF_REST = CONST.RDF + 'rest';
CONST.RDF_NIL = CONST.RDF + 'nil';
CONST.RDF_TYPE = CONST.RDF + 'type';
CONST.RDF_PLAIN_LITERAL = CONST.RDF + 'PlainLiteral';
CONST.RDF_XML_LITERAL = CONST.RDF + 'XMLLiteral';
CONST.RDF_OBJECT = CONST.RDF + 'object';
CONST.RDF_LANGSTRING = CONST.RDF + 'langString';