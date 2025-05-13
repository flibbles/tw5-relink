/*\

Provides a means for modules to relink tiddlers based on their prefix
in a way that's clean and efficient. All modules must have a prefix
value, and all tiddlers which start with that prefix will be passed to that
module.

\*/

"use strict";

var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var prefixOperators = utils.getModulesByTypeAsHashmap('relinkprefix', 'prefix');
var startsWith = utils.startsWith;

// We only need to register this if there exist any modules.
// The core relink doesn't have any of its own.
if ($tw.utils.count(prefixOperators) > 0) {

exports.name = 'prefix';

exports.report = function(tiddler, callback, options) {
	var title = tiddler.fields.title;
	for (var prefix in prefixOperators) {
		if (startsWith(title, prefix)) {
			prefixOperators[prefix].report(tiddler, callback, options);
		}
	}
};

exports.relink = function(tiddler, fromTitle, toTitle, changes, options) {
	var title = tiddler.fields.title;
	for (var prefix in prefixOperators) {
		if (startsWith(title, prefix)) {
			prefixOperators[prefix].relink(tiddler, fromTitle, toTitle, changes, options);
		}
	}
};

}
