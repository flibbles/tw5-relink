/*\
title: $:/plugins/flibbles/relink/js/relinkoperations/installed.js
type: application/javascript
module-type: relinkoperation

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
	$tw.utils.each(installed, function(field) {
		relinkListOrField(tiddler, field, fromTitle, toTitle, changes);
	});
};

function relinkListOrField(tiddler, field, fromTitle, toTitle, changes) {
	var value = tiddler.fields[field];
	if (value) {
		if (typeof value === 'string') {
			utils.relinkField(tiddler,field, fromTitle, toTitle, changes);
		} else {
			utils.relinkList(tiddler, field, fromTitle, toTitle, changes);
		}
	}
};

function getInstalledFields() {
	if (installed === undefined) {
		installed = []
		$tw.utils.each($tw.Tiddler.fieldModules, function(module) {
			if (module.relinkable) {
				installed.push(module.name);
			}
		});
	}
	return installed;
};
