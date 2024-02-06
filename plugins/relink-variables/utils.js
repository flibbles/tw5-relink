/*\
title: $:/plugins/flibbles/relink-variables/utils.js
module-type: library
type: application/javascript

\*/

exports.prefix = "$:/temp/flibbles/relink-variables/";

exports.removePrefix = function(title) {
	if (title.substr(0, exports.prefix.length) === exports.prefix) {
		return title.substr(exports.prefix.length);
	} else {
		return null;
	}
};
