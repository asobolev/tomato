angular.module('filters', [])

.filter('asShortURI', function() {
    return function(input) {
        return input.length < 25 ? input : input.slice(0, 7) + "..." + input.slice(input.length - 15);
    };
})

.filter('asShortValue', function() {
    return function(input) {
        return input.length < 50 ? input : input.slice(0, 50) + "...";
    };
});