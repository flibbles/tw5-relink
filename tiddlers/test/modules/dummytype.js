/*\
module-type: relinkfieldtype

This dummy type ensures that Relink is capable of pluging in new types.
It's used for tests in filter_types.js and inlinedef.js
\*/

exports.name = "dummy-type";

exports.relink = function(value, fromTitle, toTitle, options) {
	return undefined;
};
