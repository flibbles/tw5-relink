/*\
This manages replacing titles that occur inside text references,

tiddlerTitle
tiddlerTitle!!field
!!field
tiddlerTitle##propertyIndex
\*/

exports.name = "reference";

exports.relink = function(value, fromTitle, toTitle, options) {
	console.log("REFERENCE: ", value, toTitle);
	var reference = $tw.utils.parseTextReference(value);
	if (reference.title !== fromTitle) {
		return undefined;
	}
	reference.title = toTitle;
	return exports.toString(reference);
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
