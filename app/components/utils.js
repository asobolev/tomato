/**
 * Static class with common utility functions.
 */
function TomatoUtils() {}

TomatoUtils.split = function(prefixes, URI) {
    for (var pfx in prefixes) {
        if (URI.indexOf(prefixes[pfx]) == 0) {
            return [pfx, URI.slice(prefixes[pfx].length)]
        }
    }

    return ["", URI];
};

TomatoUtils.shrink = function(prefixes, URI) {
    var both = TomatoUtils.split(prefixes, URI);
    return both[0] + ":" + both[1];
};