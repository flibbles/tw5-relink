/*\

This handles the context for variables. Either from $set, $vars, or \define

\*/

var Context = require('./context').context;

function VariableContext(parent, setParseTreeNode) {
	this.parent = parent;
	// Now create a new widget and attach it.
	var attachPoint = parent.widget;
	var setWidget = attachPoint.makeChildWidget(setParseTreeNode);
	setWidget.computeAttributes();
	setWidget.execute();
	// point our widget to bottom, where any other contexts would attach to
	//TODO: Maybe this part can be moved into a common method. And the methods below too.
	this.widget = setWidget;
	while (this.widget.children.length > 0) {
		this.widget = this.widget.children[0];
	}
};

exports.variable = VariableContext;

VariableContext.prototype = new Context();

VariableContext.prototype.getMacroDefinition = function(variableName) {
	// widget.variables is prototyped, so it looks up into all its parents too
	return this.widget.variables[variableName] || $tw.macros[variableName];
};
