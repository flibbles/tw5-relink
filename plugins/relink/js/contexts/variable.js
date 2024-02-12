/*\

This handles the context for variables. Either from $set, $vars, or \define

\*/

var WidgetContext = require('./widget').widget;

function VariableContext(parent, setParseTreeNode) {
	var name = setParseTreeNode.attributes.name.value;
	this.parent = parent;
	// Now create a new widget and attach it.
	var attachPoint = parent.widget;
	this.setWidget = attachPoint.makeChildWidget(setParseTreeNode);
	attachPoint.children.push(this.setWidget);
	this.setWidget.computeAttributes();
	this.setWidget.execute();
	// We get the title of our current parameter focus
	// (i.e. what \param would affect)
	// If it's another definition, then title will be null.
	this.setWidget.variables[name].tiddler = parent.getFocus().title;
	// point our widget to bottom, where any other contexts would attach to
	this.widget = this.getBottom(this.setWidget);
	this.parameterFocus = true;
	if (setParseTreeNode.isMacroDefinition) {
		this.placeholderList = Object.create(parent.getPlaceholderList());
		for (var i = 0; i < setParseTreeNode.params.length; i++) {
			this.placeholderList[setParseTreeNode.params[i].name] = true;
		}
	}
};

exports.variable = VariableContext;

VariableContext.prototype = new WidgetContext();

VariableContext.prototype.getFocus = function() {
	if(this.parameterFocus) {
		return this;
	} else {
		return this.parent.getFocus();
	}
};

VariableContext.prototype.getPlaceholderList = function() {
	if (this.placeholderList !== undefined) {
		return this.placeholderList;
	} else {
		return this.parent.getPlaceholderList();
	}
};

VariableContext.prototype.addParameter = function(parameter) {
	if(this.parameterFocus) {
		var name = this.setWidget.setName;
		var data = this.setWidget.variables[name];
		data.params.push({name: parameter});
	} else if (this.parent) {
		this.parent.addParameter(parameter);
	}
};
