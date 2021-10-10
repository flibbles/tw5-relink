/*\
module-type: relinkoperator

If a tiddler has a field 'undefined' set to the target tiddler, the report
returns an undefined blurb.

\*/

"use strict";

exports.name = 'test-undefined';

exports.report = function(tiddler, callback, options) {
	if (tiddler && tiddler.fields['undefined']) {
		callback(tiddler.fields['undefined'] /*, undefined*/);
	}
};

// Tests that relinkoperators are capable of deleting fields
exports.relink = function(tiddler, fromTitle, toTitle, changes, options) {
	if (fromTitle === 'undefined' && tiddler && tiddler.fields['undefined']) {
		changes[toTitle] = {output: tiddler.fields[fromTitle]};
		changes[fromTitle] = {output: null};
	}
};
