/*\
title: $:/plugins/flibbles/relink-fieldnames/reference.js
module-type: relinkreference
type: application/javascript

Takes care of renaming 
\*/

var utils = require("./utils.js");

exports.name = 'fieldname';

exports.report = function(reference, callback, options) {
	if (reference.field
	&& !utils.isReserved(reference.field, options)) {
		callback(reference.field, (reference.title || '') + "!!", {soft: true});
	}
};

exports.relink = function(reference, fromTitle, toTitle, options) {
	if (reference.field === fromTitle
	&& !utils.isReserved(fromTitle, options)) {
		if (utils.isReserved(toTitle, options)) {
			return {impossible: true};
		} else {
			reference.field = toTitle;
			return {output: reference};
		}
	}
};
