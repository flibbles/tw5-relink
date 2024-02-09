/*\
title: $:/plugins/flibbles/relink-fieldnames/fieldtypes/fieldnamelist.js
module-type: relinkfieldtype
type: application/javascript

This field type behaves exactly like the "title" field type, except that
it ignores any titles that appear on the field name blacklist.

\*/

exports.name = 'fieldnamelist';

var utils = require("../utils.js");
var listModule = require("$:/plugins/flibbles/relink/js/fieldtypes/list.js");

exports.report = function(value, callback, options) {
	var list = $tw.utils.parseStringArray(value);
	for (var i = 0; i < list.length; i++) {
		if (!utils.isReserved(list[i], options)) {
			callback(list[i], undefined, {soft: true});
		}
	}
};

exports.relink = function(value, fromTitle, toTitle, options) {
	var entry;
	if (!utils.isReserved(fromTitle, options)) {
		entry = listModule.relink(value, fromTitle, toTitle, options);
		if (entry && entry.output && utils.isReserved(toTitle, options)) {
			// The list updated, but we can't actaully update to this new title
			return {impossible: true};
		}
	}
	return entry;
};
