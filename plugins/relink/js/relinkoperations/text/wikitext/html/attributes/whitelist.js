/*\ 

Handles replacement of widget attributes that are specified in the whitelist.

\*/

exports.name = "whitelist";

exports.getHandler = function(element, attribute, options) {
	var setting = options.settings.getAttribute(element.tag);
	return setting && setting[attribute.name];
};
