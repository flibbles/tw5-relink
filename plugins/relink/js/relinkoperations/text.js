/*\

Depending on the tiddler type, this will apply textOperators which may
relink titles within the body.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var utils = require('$:/plugins/flibbles/relink/js/utils.js');

exports.name = 'text';

var textOperators = utils.getModulesByTypeAsHashmap('relinktext', 'type');

// Set up any aliases, mostly for backward-compatibility
$tw.utils.each(Object.keys(textOperators), function(type) {
	var operator = textOperators[type];
	if(operator.aliases) {
		for(var index = 0; index < operator.aliases.length; index++) {
			textOperators[operator.aliases[index]] = operator;
		}
	}
});

// These are deprecated. Don't use them.
var oldTextOperators = utils.getModulesByTypeAsHashmap('relinktextoperator', 'type');

exports.report = function(tiddler, callback, options) {
	if (tiddler.fields.text) {
		var type = getType(tiddler, options);
		if (textOperators[type]) {
			textOperators[type].report(tiddler.fields.text, callback, options);
		} else if (oldTextOperators[type]) {
			// For the deprecated text operators
			oldTextOperators[type].report(tiddler, callback, options);
		}
	}
};

exports.relink = function(tiddler, fromTitle, toTitle, changes, options) {
	if (tiddler.fields.text) {
		var type = getType(tiddler, options),
			entry;
		if (textOperators[type]) {
			entry = textOperators[type].relink(tiddler.fields.text, fromTitle, toTitle, options);
		} else if (oldTextOperators[type]) {
			// For the deprecated text operators
			entry = oldTextOperators[type].relink(tiddler, fromTitle, toTitle, options);
		}
		if (entry) {
			changes.text = entry;
		}
	}
};

/* The type of the tiddler is determined based on:
 * 1. Whether there's an exception specified on it.
 * 2. The type the tiddler says it is.
 * 3. Or the default vnd.tiddlywiki type if not specified.
 */
function getType(tiddler, options) {
	return options.settings.getException(tiddler.fields.title)
		|| tiddler.fields.type
		|| "text/vnd.tiddlywiki";
};
