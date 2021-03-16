/*\
module-type: relinkfieldtype

This dummy type ensures that Relink is capable of pluging in new types.
It's used for tests in filter_types.js and inlinedef.js
\*/

exports.name = "dummy-type";

exports.aliases = ['old-dummy-type'];

exports.relink = function(text, fromTitle, toTitle, options) {
	// dummy will replaced fully-uppercased versions of fromTitle.
	// This doesn't work unless the dummy surveyor gives the go-ahead
	// on strings with the uppercase version of fromTitle.
	if (text === fromTitle || text === fromTitle.toUpperCase()) {
		var output = toTitle;
		// If its defining tiddler has a prepend field, then prepend it
		// to the output. This is to test fieldtype access to fields.
		if (this.fields.prepend) {
			output = this.fields.prepend + output;
		}
		return {output: output};
	}
	return undefined;
};
