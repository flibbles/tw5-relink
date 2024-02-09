/*\
title: $:/plugins/flibbles/relink-fieldnames/fieldtypes/fieldname.js
module-type: relinkfieldtype
type: application/javascript

This field type behaves exactly like the "title" field type, except that
it ignores any titles that appear on the field name blacklist.

\*/

exports.name = 'fieldname';

var utils = require("../utils.js");

exports.report = function(value, callback, options) {
	if (!utils.isReserved(value, options)) {
		callback(value, undefined, {soft: true});
	}
};

exports.relink = function(value, fromTitle, toTitle, options) {
	if (value === fromTitle
	&& !utils.isReserved(fromTitle, options)) {
		if (utils.isReserved(toTitle, options)
		|| !utils.isValidFieldName(toTitle)) {
			return {impossible: true};
		} else {
			return {output: toTitle};
		}
	}
	return undefined;
};
