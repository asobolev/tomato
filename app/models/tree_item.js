/**
 * Class that represents a Resource item in the RDF types tree
 *
 */
function ResourceItem(predicate, rdfType, reverse) {

    var badge = '<span class="badge">' + rdfType.qty + '</span>\t ';
    var arrow = '<span class="glyphicon glyphicon-arrow-' + (reverse ? "left" : "right") + '" aria-hidden="true"></span>';
    var pre = predicate == null ? "" : '<small>' + predicate.split(":")[0] + ':</small>' + predicate.split(":")[1];
    var post = '<small>' + rdfType.prefix + ':</small>' + rdfType.name;

    this.key = rdfType.getURI();
    this.title = "<div>" + badge + (pre == "" ? "" : pre + " " + arrow + " ") + post + "</div>";
    this.folder = true;
    this.lazy = true;
    this.extraClasses = "resourceItem";
}


/**
 * Class that represents a Predicate item in the RDF types tree
 *
 */
function PredicateItem(predicate) {

    this.key = predicate;
    this.title = '<small>' + predicate.split(":")[0] + ':</small>' + predicate.split(":")[1];
    this.folder = false;
    this.lazy = false;
    this.extraClasses = "predicateItem";
}
