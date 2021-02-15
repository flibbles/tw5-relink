/*\

This handles the fetching and distribution of relink settings.

\*/

var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var Context = require('./context').context;

function ImportContext(wiki, parent) {
	this.macros = Object.create(null);
	this.parent = parent;
	this.wiki = wiki;
	this.reservedmacroNames = Object.create(null);
};

exports.import = ImportContext;

ImportContext.prototype = new Context();


ImportContext.prototype.import = function(filter) {
	var parentWidget = this.getVariableWidget();
	var importWidget = createImportWidget(filter, this.wiki, parentWidget);
	this._compileList(importWidget.tiddlerList);
	// This only works if only one filter is imported
	this.addWidget(importWidget);
};

ImportContext.prototype.changed = function(changes) {
	if (this.widget && this.widget.refresh(changes)) {
		return true;
	}
	return false;
};

ImportContext.prototype.getMacros = function() {
	var signatures = this.parent.getMacros();
	for (var macroName in this.macros) {
		var macro = this.macros[macroName];
		for (var param in macro) {
			signatures[macroName + "/" + param] = macro[param];
		}
	}
	return signatures;
};

// But macro we handle differently.
ImportContext.prototype.getMacro = function(macroName) {
	var theseSettings = this.macros[macroName];
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

ImportContext.prototype.addSetting = function(macroName, parameter, type, sourceTitle) {
	var macro = this.macros[macroName];
	type = type || utils.getDefaultType(this.wiki);
	if (macro === undefined) {
		macro = this.macros[macroName] = Object.create(null);
	}
	var handler = utils.getType(type);
	if (handler) {
		handler.source = sourceTitle;
		// We attach the fields of the defining tiddler for the benefit
		// of any 3rd party field types that want access to them.
		var tiddler = this.wiki.getTiddler(sourceTitle);
		handler.fields = tiddler.fields;
		macro[parameter] = handler;
	}
};

ImportContext.prototype.createChildLibrary = function(title) {
	return new ImportContext(this.wiki, this, title);
};

ImportContext.prototype.addWidget = function(widget) {
	this.widget = widget;
	while (this.widget.children.length > 0) {
		this.widget = this.widget.children[0];
	}
};

ImportContext.prototype.getVariableWidget = function() {
	if (!this.widget) {
		var varWidget = this.parent && this.parent.widget;
		var parentWidget = this.wiki.makeWidget(null,{parentWidget: varWidget});
		parentWidget.setVariable("currentTiddler", this.title);
		var widget = this.wiki.makeWidget(null, {parentWidget: parentWidget});
		this.addWidget(widget);
	}
	return this.widget;
};

/**This takes macros, specifically relink placeholders, and remembers them
 * It creates a dummy object for them, since we'll never need the definition
 */
ImportContext.prototype.reserveMacroName = function(variableName) {
	this.reservedmacroNames[variableName] = {
		value: "",
		params: []};
};

ImportContext.prototype.addMacroDefinition = function(setParseTreeNode) {
	var bottomWidget = this.getVariableWidget();
	var setWidget = bottomWidget.makeChildWidget(setParseTreeNode);
	setWidget.computeAttributes();
	setWidget.execute();
	this.addWidget(setWidget);
};

ImportContext.prototype.getMacroDefinition = function(variableName) {
	return this.getVariableWidget().variables[variableName] || $tw.macros[variableName] || this.reservedmacroNames[variableName];
};

function createImportWidget(filter, wiki, parent) {
	var widget = wiki.makeWidget( { tree: [{
		type: "importvariables",
		attributes: {
			"filter": {
				type: "string",
				value: filter
			}
		}
	}] }, { parentWidget: parent} );
	widget.execute();
	widget.renderChildren();
	var importWidget = widget.children[0];
	return importWidget;
};

ImportContext.prototype._compileList = function(titleList) {
	for (var i = 0; i < titleList.length; i++) {
		var parser = this.wiki.parseTiddler(titleList[i]);
		if (parser) {
			var parseTreeNode = parser.tree[0];
			while (parseTreeNode && parseTreeNode.type === "set") {
				if (parseTreeNode.relink) {
					for (var macroName in parseTreeNode.relink) {
						var parameters = parseTreeNode.relink[macroName];
						for (paramName in parameters) {
							this.addSetting(macroName, paramName, parameters[paramName], titleList[i]);
						}
					}
				}
				parseTreeNode = parseTreeNode.children && parseTreeNode.children[0];
			}
		}
	}
};
