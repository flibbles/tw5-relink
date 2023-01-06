/*\ 

Handles replacement of widget attributes that are specified in the whitelist.

\*/

exports.name = "whitelist";

exports.getHandler = function(element, attributeName, options) {
	var setting = options.settings.getAttribute(element.tag);
	return setting && setting[attributeName];
};
