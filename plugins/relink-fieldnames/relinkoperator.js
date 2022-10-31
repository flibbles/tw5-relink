/*\
title: $:/plugins/flibbles/relink-fieldnames/relinkoperator.js
module-type: relinkoperator
type: application/javascript

Updates the field names if they correspond to the renamed tiddler.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

exports.name = 'field-names';

var configPrefix = "$:/config/flibbles/relink/fields/"
var reservedFields = {
	title: true,
	text: true,
	type: true
};

exports.report = function(tiddler, callback, options) {
	var fields = tiddler.fields;
	for (var field in fields) {
		if (!reservedFields[field]) {
			callback(field, ': ' + abridge(fields[field], 20), {soft: true});
		}
	}
};

exports.relink = function(tiddler, fromTitle, toTitle, changes, options) {
	if ($tw.utils.hop(tiddler.fields, fromTitle)
	&& !reservedFields[fromTitle]) {
		if ($tw.utils.hop(tiddler.fields, toTitle)
		|| reservedFields[toTitle]
		|| !isValidFieldName(toTitle)) {
			// There is already a [toTitle] field, and we won't clobber it.
			// Or this is an illegal field name
			changes[fromTitle] = {impossible: true};
		} else if ($tw.utils.hop(changes, fromTitle)) {
			// If the value changed, we need the changed value, assuming there
			// is one.
			changes[toTitle] = {
				output: changes[fromTitle].output || tiddler.fields[fromTitle]
			};
			// But we leave the original change in place in case it described
			// an impossible relink or something.
			changes[fromTitle].output = null;
		} else {
			changes[toTitle] = {output: tiddler.fields[fromTitle]};
			changes[fromTitle] = {output: null};
		}
	}
	// If this is a whitelist entry for the fromTitle field, update it.
	if (tiddler.fields.title === configPrefix + fromTitle) {
		var newTitle = configPrefix + toTitle;
		// Make sure we wouldn't be deleting an existing whitelist entry.
		changes.title = (!options.wiki.tiddlerExists(newTitle)) ?
			{ output: newTitle }:
			{ impossible: true };
	}
};

// Pre v5.2.0, this will be false. But we can't rely on utils.isValidFieldName
// entirely, because it is forgiving about capitalization when we can't be.
var capitalizationAllowed = $tw.utils.isValidFieldName("A:");

function isValidFieldName(field) {
	return $tw.utils.isValidFieldName(field)
		&& (capitalizationAllowed || !/[A-Z]/.test(field));
};

function abridge(string, length) {
	return (string.length > length)? string.substr(0, length) + "..." : string;
};
