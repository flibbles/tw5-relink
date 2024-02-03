/*\ 
Handles replacement in $action-sendmessage widgets

\*/

exports.name = "sendmessage";

exports.getHandler = function(element, attribute, options) {
	if (element.tag === "$action-sendmessage"
	&& attribute.name[0] !== "$") {
		var messageAttr = element.attributes['$message'];
		if (messageAttr) {
			var regexp = options.settings.getConfig("messages")[messageAttr.value];
			if (regexp) {
				var results = regexp.exec(attribute.name);
				if (results && results[0] === attribute.name) {
					return options.settings.getFields()[results[1]];
				}
			}
		}
	}
};

exports.formBlurb = function(element, attribute, blurb, options) {
	var messageAttr = element.attributes['$message'];
	var newBlurb = '$action-sendmessage ' + messageAttr.value + ' ' + attribute.name;
	if (blurb) {
		newBlurb += '=' + blurb;
	}
	return newBlurb;
};
