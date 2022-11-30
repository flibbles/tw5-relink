/*\
This manages replacing titles that occur inside text references,

tiddlerTitle
tiddlerTitle!!field
!!field
tiddlerTitle##propertyIndex
\*/

var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var referenceOperators = utils.getModulesByTypeAsHashmap('relinkreference', 'name');

exports.name = "reference";

exports.report = function(value, callback, options) {
	if (value) {
		var reference = $tw.utils.parseTextReference(value);
		for (var operator in referenceOperators) {
			referenceOperators[operator].report(reference, callback, options);
		}
	}
};

exports.relink = function(value, fromTitle, toTitle, options) {
	var entry;
	if (value) {
		var impossible = false;
		var modified = false;
		var reference = $tw.utils.parseTextReference(value);
		for (var operator in referenceOperators) {
			var result = referenceOperators[operator].relink(reference, fromTitle, toTitle, options);
			if (result) {
				if (result.impossible) {
					impossible = true;
				}
				if (result.output) {
					modified = true;
					reference = result.output;
				}
			}
		}
		if (modified) {
			if (exports.canBePretty(reference.title)) {
				entry = {output: exports.toString(reference)};
			} else {
				impossible = true;
			}
		}
		if (impossible) {
			entry = entry || {};
			entry.impossible = true;
		}
	}
	return entry;
};

/* Same as this.relink, except this has the added constraint that the return
 * value must be able to be wrapped in curly braces.
 */
exports.relinkInBraces = function(value, fromTitle, toTitle, options) {
	var log = this.relink(value, fromTitle, toTitle, options);
	if (log && log.output && log.output.indexOf("}") >= 0) {
		delete log.output;
		log.impossible = true;
	}
	return log;
};

exports.toString = function(textReference) {
	var title = textReference.title || '';
	if (textReference.field) {
		return title + "!!" + textReference.field;
	} else if (textReference.index) {
		return title + "##" + textReference.index;
	}
	return title;
};

exports.canBePretty = function(title)  {
	return !title || (title.indexOf("!!") < 0 && title.indexOf("##") < 0);
};
