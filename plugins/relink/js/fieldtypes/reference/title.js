/*\

This handles the title inside of references.

\*/

var titleRelinker = require('../title.js');

exports.name = 'title';

exports.report = function(reference, callback, options) {
	var title = reference.title;
	titleRelinker.report(reference.title, function(title, blurb, style) {
		if (reference.field) {
			callback(title, '!!' + reference.field);
		} else if (reference.index) {
			callback(title, '##' + reference.index);
		} else {
			callback(title);
		}
	}, options);
};

exports.relink = function(reference, fromTitle, toTitle, options) {
	var entry = titleRelinker.relink($tw.utils.trim(reference.title), fromTitle, toTitle, options);
	if (entry && entry.output) {
		// preserve user's whitespace
		reference.title = reference.title.replace(fromTitle, entry.output);
		entry.output = reference;
	}
	return entry;
};
