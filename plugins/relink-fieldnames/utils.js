/*\
title: $:/plugins/flibbles/relink-fieldnames/utils.js
module-type: library
type: application/javascript

\*/

var blacklistTiddler = "$:/config/flibbles/relink/fieldnames/blacklist";
var docPrefix = "$:/language/Docs/Fields/";

var whitelist = require('$:/plugins/flibbles/relink/js/utils.js').getContext('whitelist');

whitelist.hotDirectories.push(docPrefix);

exports.isReserved = function(field, options) {
	var method = options.settings.getConfig("fieldnames").blacklist || function() { return true; };
	return method(field);
};

// Pre v5.2.0, this will be false. But we can't rely on utils.isValidFieldName
// entirely, because it is forgiving about capitalization when we can't be.
var capitalizationAllowed = $tw.utils.isValidFieldName("A:");

exports.isValidFieldName = function(field) {
	return $tw.utils.isValidFieldName(field)
		&& (capitalizationAllowed || !/[A-Z]/.test(field));
};

