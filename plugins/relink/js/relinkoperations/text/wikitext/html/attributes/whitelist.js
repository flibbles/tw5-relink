/*\ 

Handles replacement of widget attributes that are specified in the whitelist.

\*/

exports.name = "whitelist";

exports.getHandler = function(context, element, attributeName) {
	var setting = context.getAttribute(element.tag);
	return setting && setting[attributeName];
};
