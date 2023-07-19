/*\

Handles replacement in $macrocall widgets

\*/

exports.name = "macrocall";

exports.getHandler = function(element, attribute, options) {
	if (element.tag === "$macrocall") {
		var nameAttr = element.attributes["$name"];
		if (nameAttr) {
			var setting = options.settings.getMacro(nameAttr.value);
			return setting && setting[attribute.name];
		}
	}
};

exports.formBlurb = function(element, attribute, blurb, options) {
	var nameAttr = element.attributes["$name"];
	var newBlurb = '<' + nameAttr.value + ' ' + attribute.name;
	if (blurb) {
		newBlurb += '=' + blurb;
	}
	return newBlurb;
};
