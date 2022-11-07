/*\
title: $:/plugins/flibbles/relink-fieldnames/utils.js
module-type: library
type: application/javascript

\*/

var blacklistTiddler = "$:/config/flibbles/relink-fieldnames/blacklist";
var docPrefix = "$:/language/Docs/Fields/";

var whitelist = require('$:/plugins/flibbles/relink/js/utils.js').getContext('whitelist');

whitelist.hotDirectories.push(docPrefix);
whitelist.hotDirectories.push("$:/config/flibbles/relink-fieldnames/");

exports.isReserved = function(wiki, field) {
	var method = wiki.getGlobalCache('relink-fieldnames-reserved', function() {
		var blacklist = wiki.getTiddler(blacklistTiddler);
		if (blacklist) {
			var tiddlers = wiki.filterTiddlers(blacklist.fields.filter);
			var fieldMap = Object.create(null);
			for (var i = 0; i < tiddlers.length; i++) {
				fieldMap[tiddlers[i]] = true;
			}
			return function(field) {return fieldMap[field] || false;};
		} else {
			// no blacklist. fieldnames is disabled. Everything is reserved.
			return function() { return true; };
		}
	});
	return method(field);
};

// Pre v5.2.0, this will be false. But we can't rely on utils.isValidFieldName
// entirely, because it is forgiving about capitalization when we can't be.
var capitalizationAllowed = $tw.utils.isValidFieldName("A:");

exports.isValidFieldName = function(field) {
	return $tw.utils.isValidFieldName(field)
		&& (capitalizationAllowed || !/[A-Z]/.test(field));
};

