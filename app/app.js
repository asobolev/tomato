'use strict';

require('angular');

var filtersModule = require('./filters');

var infoService = require('./services/info');
var storeService = require('./services/store');
var queryService = require('./services/query');
var typesService = require('./services/types');

var filesPane = require('./controllers/FilesPane');
var historyPane = require('./controllers/HistoryPane');
var infoPane = require('./controllers/InfoPane');
var queryPane = require('./controllers/QueryPane');
var tablePane = require('./controllers/TablePane');
var typesPane = require('./controllers/TypesPane');

var filters = angular.module('filters', []);
var services = angular.module('services', []);
var app = angular.module('tomato', ['services', 'filters']);

filters.filter('asShortURI', filtersModule.asShortURI);
filters.filter('asShortValue', filtersModule.asShortValue);
filters.filter('orderByColumn', filtersModule.orderByColumn);

services.factory('info', infoService);
services.factory('store', storeService);
services.factory('query', queryService);
services.factory('types', typesService);

app.controller('FilesPane', ['$scope', '$rootScope', 'store', 'info', filesPane]);
app.controller('HistoryPane', ['$scope', 'query', historyPane]);
app.controller('InfoPane', ['$scope', 'info', infoPane]);
app.controller('QueryPane', ['$scope', 'query', queryPane]);
app.controller('TablePane', ['$scope', '$filter', 'store', 'query', 'types', 'info', tablePane]);
app.controller('TypesPane', ['$scope', '$filter', 'store', 'query', 'types', 'info',typesPane]);
