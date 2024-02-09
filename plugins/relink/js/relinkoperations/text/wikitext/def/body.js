/*\

Takes care of relinking the bodies of definitions.

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils");

exports.name = "body";

exports.report = function(definition, callback, options) {
	var handler = getHandler(definition.type, definition.name);
	if (handler) {
		var newOptions = Object.create(options);
		var entry = handler.report(definition.body, function(title, blurb, style) {
			var macroStr = '\\' + definition.type + ' ' + definition.name + '()';
			if (blurb) {
				macroStr += ' ' + blurb;
			}
			callback(title, macroStr, style);
		}, newOptions);
	}
};

exports.relink = function(definition, fromTitle, toTitle, options) {
	var handler = getHandler(definition.type, definition.name);
	var results;
	if (handler) {
		var newOptions = Object.create(options);
		results = handler.relink(definition.body, fromTitle, toTitle, newOptions);
		if (results && results.output) {
			definition.body = results.output;
		}
	}
	return results;
};

function getHandler(macroType, macroName) {
	var type;
	switch (macroType) {
	case "function":
		type = "filter";
		break;
	case "define":
		/**This returns the handler to use for a macro
		 * By default, we treat them like wikitext, but Relink used to make
		 * little macros as placeholders. If we find one, we must return
		 * the correct handler for what that placeholder represented.
		 */
		var placeholder = /^relink-(?:(\w+)-)?\d+$/.exec(macroName);
		// normal macro or special placeholder?
		if (placeholder) {
			type = placeholder[1] || 'title';
			break;
		}
	default:
		type = 'wikitext';
	}
	return utils.getType(type);
};
