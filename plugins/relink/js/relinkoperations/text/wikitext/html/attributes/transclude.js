/*\

Handles replacement in $transclude widgets

\*/

exports.name = "transclude";

exports.getHandler = function(element, attribute, options) {
	if (element.tag === "$transclude") {
		var name = attribute.name;
		if (name[0] === '$') {
			if (name[1] === '$') {
				name = name.substr(1);
			} else {
				// This is a reserved attribute
				return;
			}
		}
		var nameAttr = element.attributes["$variable"];
		if (nameAttr) {
			var setting = options.settings.getMacro(nameAttr.oldValue || nameAttr.value);
			return setting && setting[name];
		}
	}
};

exports.formBlurb = function(element, attribute, blurb, options) {
	var nameAttr = element.attributes["$variable"];
	var name = attribute.name;
	if (name[0] === '$') {
		name = name.substr(1);
	}
	var newBlurb = '<' + nameAttr.value + ' ' + name;
	if (blurb) {
		newBlurb += '=' + blurb;
	}
	return newBlurb;
};
