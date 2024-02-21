/*\

This handles the fetching and distribution of relink settings.

\*/

var WidgetContext = require('./widget').widget;

function ImportContext(wiki, parent, filter) {
	this.parent = parent;
	this.wiki = wiki;
	var importWidget = createImportWidget(filter, this.wiki, this.parent.widget);
	this._compileList(importWidget.tiddlerList, importWidget.variables);
	// this.widget is where we ask for macro definitions.
	// This only works if only one filter is imported
	this.widget = this.getBottom(importWidget);
	// We keep this one because it's where we need to test for changes from.
	this.importWidget = importWidget
	// Trickle this up, so that any containing tiddlercontext knows that this
	// tiddler does some importing, and must be checked regularly.
	parent.hasImports(true);
};

exports.import = ImportContext;

ImportContext.prototype = new WidgetContext();

ImportContext.prototype.changed = function(changes) {
	return this.importWidget && this.importWidget.refresh(changes)
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
	if (parent) {
		parent.children.push(widget);
	}
	widget.execute();
	widget.renderChildren();
	var importWidget = widget.children[0];
	return importWidget;
};

ImportContext.prototype._compileList = function(titleList, variables) {
	for (var i = 0; i < titleList.length; i++) {
		var parser = this.wiki.parseTiddler(titleList[i]);
		if (parser) {
			var parseTreeNode = parser.tree[0];
			while (parseTreeNode && parseTreeNode.type === "set") {
				var variable = variables[parseTreeNode.attributes.name.value];
				if(variable) {
					variable.tiddler = titleList[i];
				}
				if (parseTreeNode.relink) {
					for (var macroName in parseTreeNode.relink) {
						var parameters = parseTreeNode.relink[macroName];
						for (var paramName in parameters) {
							this.addSetting(this.wiki, macroName, paramName, parameters[paramName], titleList[i]);
						}
					}
				}
				parseTreeNode = parseTreeNode.children && parseTreeNode.children[0];
			}
		}
	}
};
