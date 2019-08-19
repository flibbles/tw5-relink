/*\

Handles all fields registered as tiddlerfield modules, that //also// specify
that they're 'relinkable': true.

Whether they're lists or fields, this will figure it out for itself.
\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var installed;

exports['installed'] = function(tiddler, fromTitle, toTitle, changes, options) {
	var installed = getInstalledFields();
	$tw.utils.each(installed, function(module, field) {
		var value = tiddler.fields[field];
		if (value) {
			var relink;
			if (typeof value !== 'string') {
				relink = utils.relinkList;
			} else if (module.type === 'list') {
				relink = utils.relinkStringList;
			} else if (module.type === 'filter') {
				relink = utils.relinkFilter;
			} else {
				relink = utils.relinkField;
			}
			var handler = new utils.FieldHandler(tiddler, field);
			var value = relink(handler, fromTitle, toTitle);
			if (value != undefined) {
				changes[field] = value;
			}
		}
	});
};

function relinkListOrField(tiddler, module, fromTitle, toTitle, changes) {
};

function getInstalledFields() {
	if (installed === undefined) {
		installed = {};
		$tw.utils.each($tw.Tiddler.fieldModules, function(module) {
			if (module.relinkable) {
				installed[module.name] = module;
			}
		});
	}
	return installed;
};
