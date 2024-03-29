/*\

This is a virtual subclass of context for contexts that exist within widgets
of a specific tiddler.

All widget contexts must have a widget member.

\*/

var Context = require('./context.js').context;
var utils = require('$:/plugins/flibbles/relink/js/utils.js');

function WidgetContext() {};

exports.widget = WidgetContext;

WidgetContext.prototype = new Context();

WidgetContext.prototype.getMacroDefinition = function(variableName) {
	// widget.variables is prototyped, so it looks up into all its parents too
	var def = this.widget.variables[variableName];
	if (!def) {
		// It might be a javascript macro
		def = $tw.macros[variableName];
		if (def && !def.tiddler) {
			// We haven't assigned associated tiddlers to these macros yet.
			// That may be important for some installed supplemental plugins.
			$tw.modules.forEachModuleOfType('macro', function(title, module) {
				if (module.name) {
					// For now, we just attach it directly to the definition
					// It's easier, albeit a little sloppy.
					$tw.macros[module.name].tiddler = title;
				}
			});
		}
	}
	return def;
};

WidgetContext.prototype.addSetting = function(wiki, macroName, parameter, type, sourceTitle) {
	this.macros = this.macros || Object.create(null);
	var macro = this.macros[macroName];
	type = type || utils.getDefaultType(wiki);
	if (macro === undefined) {
		macro = this.macros[macroName] = Object.create(null);
	}
	var handler = utils.getType(type);
	if (handler) {
		handler.source = sourceTitle;
		macro[parameter] = handler;
	}
};

WidgetContext.prototype.getMacros = function() {
	var signatures = this.parent.getMacros();
	if (this.macros) {
		for (var macroName in this.macros) {
			var macro = this.macros[macroName];
			for (var param in macro) {
				signatures[macroName + "/" + param] = macro[param];
			}
		}
	}
	return signatures;
};

/**This does strange handling because it's possible for a macro to have
 * its individual parameters whitelisted in separate places.
 * Don't know WHY someone would do this, but it can happen.
 */
WidgetContext.prototype.getMacro = function(macroName) {
	var theseSettings = this.macros && this.macros[macroName];
	var parentSettings;
	if (this.parent) {
		parentSettings = this.parent.getMacro(macroName);
	}
	if (theseSettings && parentSettings) {
		// gotta merge them without changing either. This is expensive,
		// but it'll happen rarely.
		var rtnSettings = $tw.utils.extend(Object.create(null), theseSettings, parentSettings);
		return rtnSettings;
	}
	return theseSettings || parentSettings;
};

WidgetContext.prototype.getAttribute = function(elementName) {
	if (elementName.charAt(0) == '$' && elementName.indexOf('.') >= 0) {
		// This is potentially a \widget, look in macros for it.
		var macroSettings = this.getMacro(elementName);
		if (macroSettings) {
			// Make sure that it's actually a widget definition
			var def = this.getMacroDefinition(elementName);
			if (def) {
				// We found a definition, but if it's not a widget, abort all.
				return (def.isWidgetDefinition)? macroSettings: undefined;
			}
		}
	}
	return this.parent.getAttribute(elementName);
};

WidgetContext.prototype.getOperator = function(name, index) {
	if (name.indexOf('.') >= 0) {
		// This is potentially a \function, look in macros for it.
		var macroSettings = this.getMacro(name);
		if (macroSettings) {
			//Make sure that it's actually a macro definition
			var def = this.getMacroDefinition(name);
			if (def) {
				if (def.isFunctionDefinition) {
					// Minus one because operator indices are 1 indexed,
					// but parameters as we store them are not.
					var param = def.params[index - 1];
					return param && macroSettings[param.name];
				}
				// If it's not a filter, abort all.
				return undefined;
			}
		}
	}
	return this.parent.getOperator(name, index);
};

/**Returns the deepest descendant of the given widget.
 */
WidgetContext.prototype.getBottom = function(widget) {
	while (widget.children.length > 0) {
		widget = widget.children[0];
	}
	return widget;
};
