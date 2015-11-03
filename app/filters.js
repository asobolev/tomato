angular.module('filters', [])

.filter('asShortURI', function() {
    return function(input) {
        return input.length < 25 ? input : input.slice(0, 4) + "..." + input.slice(input.length - 12);
    };
})

.filter('asShortValue', function() {
    return function(input) {
        return input.length < 50 ? input : input.slice(0, 50) + "...";
    };
})

.filter('orderByColumn', function(){
    return function(items, field, reverse) {
        if (!(Array.isArray(items))) return items;

        var filtered = [];
        angular.forEach(items, function(item) {
            filtered.push(item);
        });

        filtered.sort(function(a, b) {
            a = a[field].value;
            b = b[field].value;
            return reverse ? a > b : a < b;
        });

        return filtered;
    }
});