/*\
title: $:/plugins/flibbles/relink-variables/utils.js
module-type: library
type: application/javascript

\*/

exports.prefix = "$:/temp/flibbles/relink-variables/";

exports.removePrefix = function(title, tiddler) {
	if (title.substr(0, exports.prefix.length) === exports.prefix) {
		title = title.substr(exports.prefix.length);
		if (!tiddler) {
			return title;
		}
		if (title.substr(0, tiddler.length) === tiddler
		&& title[tiddler.length] === ' ') {
			return title.substr(tiddler.length + 1);
		}
	}
	return null;
};
