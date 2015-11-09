
var asShortURI = function() {
    return function(input) {
        return input.length < 25 ? input : input.slice(0, 4) + "..." + input.slice(input.length - 12);
    };
};

var asShortValue = function() {
    return function(input) {
        return input.length < 50 ? input : input.slice(0, 50) + "...";
    };
};

var orderByColumn = function(){
    return function(items, field, reverse) {
        if (!(Array.isArray(items))) return items;

        var filtered = [];
        items.forEach(function(item) {
            filtered.push(item);
        });

        filtered.sort(function(a, b) {
            a = a[field].value;
            b = b[field].value;
            return reverse ? a > b : a < b;
        });

        return filtered;
    }
};

module.exports.asShortURI = asShortURI;
module.exports.asShortValue = asShortValue;
module.exports.orderByColumn = orderByColumn;