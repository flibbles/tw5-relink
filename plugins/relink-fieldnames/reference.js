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
	&& !utils.isReserved(options.wiki, reference.field)) {
		callback(reference.field, reference.title + "!!");
	}
};

exports.relink = function(reference, fromTitle, toTitle, options) {
	if (reference.field === fromTitle
	&& !utils.isReserved(options.wiki, fromTitle)) {
		if (utils.isReserved(options.wiki, toTitle)) {
			return {impossible: true};
		} else {
			reference.field = toTitle;
			return {output: reference};
		}
	}
};
