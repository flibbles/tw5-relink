/*\
module-type: relinktitlesrule
title: test/modules/titles-rule.js
type: application/javascript

This works with relink-titles both to show that 3rd party rules can be
installed, and that relink-titles handles naming collision.

Whenever $:/relink-title is renamed to something, all tiddlers that start
with $:/relink-title-test/ will be renamed to $:/relink-title-test/[toTitle].
\*/

exports.name = 'test';

var prefix = 'relink-title-test/';
var key = '$:/relink-title';

exports.report = function(title, callback, options) {
	if (title.startsWith(prefix)) {
		callback(key);
	}
};

exports.relink = function(title, fromTitle, toTitle, options) {
	if (fromTitle === key && title.startsWith(prefix)) {
		return prefix + toTitle;
	}
};
