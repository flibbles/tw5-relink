/*\
This manages replacing titles that occur inside text references,

tiddlerTitle
tiddlerTitle!!field
!!field
tiddlerTitle##propertyIndex
\*/

var CannotRelinkError = require("$:/plugins/flibbles/relink/js/errors.js").CannotRelinkError;

exports.name = "reference";

exports.relink = function(value, fromTitle, toTitle, logger, options) {
	var reference = $tw.utils.parseTextReference(value);
	if (reference.title !== fromTitle) {
		return undefined;
	}
	if (!exports.canBePretty(toTitle)) {
		logger.add({name: "reference", impossible: true});
		return undefined;
	}
	reference.title = toTitle;
	return exports.toString(reference);
};

/* Same as this.relink, except this has the added constraint that the return
 * value must be able to be wrapped in curly braces.
 */
exports.relinkInBraces = function(value, fromTitle, toTitle, logger, options) {
	var output = this.relink(value, fromTitle, toTitle, logger, options);
	if (output && toTitle.indexOf("}") >= 0) {
		logger.add({name: "reference", impossible: true});
		return undefined;
	}
	return output;
};

exports.toString = function(textReference) {
	var title = textReference.title || '';
	if (!exports.canBePretty(title)) {
		throw new CannotRelinkError();
	}
	if (textReference.field) {
		return title + "!!" + textReference.field;
	} else if (textReference.index) {
		return title + "##" + textReference.index;
	}
	return title;
};

exports.canBePretty = function(title)  {
	return title.indexOf("!!") < 0 && title.indexOf("##") < 0;
};
