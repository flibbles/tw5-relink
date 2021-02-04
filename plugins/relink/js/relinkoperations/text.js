/*\

Depending on the tiddler type, this will apply textOperators which may
relink titles within the body.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var defaultOperator = "text/vnd.tiddlywiki";

exports.name = 'text';

// TODO: Maybe use a field other than 'name', since they're mimetypes?
var textOperators = Object.create(null);
$tw.modules.forEachModuleOfType('relinktextoperator', function(title, module) {
	if (module.name !== undefined) {
		textOperators[module.name] = module;
	} else {
		// Legacy support. It has a relinker, but not a reporter
		for (var entry in module) {
			textOperators[entry] = {
				relink: module[entry],
				report: function() {}};
		}
	}
});

// $:/DefaultTiddlers is a tiddler which has type "text/vnd.tiddlywiki",
// but it lies. It doesn't contain wikitext. It contains a filter, so
// we pretend it has a filter type.
// If you want to be able to add more exceptions for your plugin, let me know.
var exceptions = {
	"$:/DefaultTiddlers": "text/x-tiddler-filter"
};

exports.report = function(tiddler, callback, options) {
	var fields = tiddler.fields;
	if (fields.text) {
		var type = exceptions[fields.title] || fields.type || defaultOperator;
		if (textOperators[type]) {
			var entry = textOperators[type].call(this, tiddler, fromTitle, toTitle, options);
		}
	}
};

exports.relink = function(tiddler, fromTitle, toTitle, changes, options) {
	var fields = tiddler.fields;
	if (fields.text) {
		var type = exceptions[fields.title] || fields.type || defaultOperator;
		if (textOperators[type]) {
			var entry = textOperators[type].relink(tiddler, fromTitle, toTitle, options);
			if (entry) {
				changes.text = entry;
			}
		}
	}
};
