/*\

This handles the fetching and distribution of relink settings.

\*/

var WidgetContext = require('./widget').widget;

function ImportContext(wiki, parent, filter) {
	this.parent = parent;
	this.wiki = wiki;
	this.import(filter);
};

exports.import = ImportContext;

ImportContext.prototype = new WidgetContext();


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

// TODO: I think this can be scrapped
ImportContext.prototype.getMacroDefinition = function(variableName) {
	return this.getVariableWidget().variables[variableName] || $tw.macros[variableName];
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
							this.addSetting(this.wiki, macroName, paramName, parameters[paramName], titleList[i]);
						}
					}
				}
				parseTreeNode = parseTreeNode.children && parseTreeNode.children[0];
			}
		}
	}
};
