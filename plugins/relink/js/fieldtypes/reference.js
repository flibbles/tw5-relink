/*\
This manages replacing titles that occur inside text references,

tiddlerTitle
tiddlerTitle!!field
!!field
tiddlerTitle##propertyIndex
\*/

exports.name = "reference";

exports.relink = function(value, fromTitle, toTitle, options) {
	var reference = $tw.utils.parseTextReference(value);
	var entry = {name: "reference"};
	if (reference.title !== fromTitle) {
		return undefined;
	}
	if (!exports.canBePretty(toTitle)) {
		entry.impossible = true;
	} else {
		reference.title = toTitle;
		entry.output = exports.toString(reference);
	}
	return entry;
};

/* Same as this.relink, except this has the added constraint that the return
 * value must be able to be wrapped in curly braces.
 */
exports.relinkInBraces = function(value, fromTitle, toTitle, options) {
	var log = this.relink(value, fromTitle, toTitle, options);
	if (log && log.output && toTitle.indexOf("}") >= 0) {
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
	return title.indexOf("!!") < 0 && title.indexOf("##") < 0;
};
