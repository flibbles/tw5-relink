/*\
module-type: relinkfieldtype

This dummy type ensures that Relink is capable of pluging in new types.
It's used for tests in filter_types.js and inlinedef.js
\*/

exports.name = "dummy-type";

exports.aliases = ['old-dummy-type'];

exports.report = function(text, callback, options) {
	callback(text, "Dummy");
	callback(text.toLowerCase(), "dummy");
	callback(text.toUpperCase(), "DUMMY");
};

exports.relink = function(text, fromTitle, toTitle, options) {
	// dummy will replaced fully-uppercased versions of fromTitle.
	if (text === fromTitle || text === fromTitle.toUpperCase()) {
		return {output: toTitle};
	}
	return undefined;
};
