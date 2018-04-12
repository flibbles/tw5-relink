/*\
title: $:/plugins/flibbles/relink/js/relinkoperations/custom.js
type: application/javascript
module-type: relinkoperation

Handles all fields specified in the plugin configuration. Currently, this
only supports single-value fields.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var prefix = "$:/config/flibbles/relink/fields/";

var utils = require('$:/plugins/flibbles/relink/js/utils.js');

exports['custom'] = function(tiddler, fromTitle, toTitle, changes, options) {
	var fields = getConfiguredFields();
	for (var field in fields) {
		utils.relinkField(tiddler, field, fromTitle, toTitle, changes);
	}
};

function getConfiguredFields() {
	var fields = Object.create(null);
	$tw.wiki.eachShadowPlusTiddlers(function(tiddler, title) {
		if (title.startsWith(prefix)) {
			fields[title.substr(prefix.length)] = tiddler.fields.text;
		}
	});
	return fields;
};
