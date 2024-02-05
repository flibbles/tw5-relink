/*\

This handles the context for variables. Either from $set, $vars, or \define

\*/

var WidgetContext = require('./widget').widget;

function VariableContext(parent, setParseTreeNode) {
	this.parent = parent;
	// Now create a new widget and attach it.
	var attachPoint = parent.widget;
	this.setWidget = attachPoint.makeChildWidget(setParseTreeNode);
	attachPoint.children.push(this.setWidget);
	this.setWidget.computeAttributes();
	this.setWidget.execute();
	// point our widget to bottom, where any other contexts would attach to
	this.widget = this.getBottom(this.setWidget);
	this.parameterFocus = true;
};

exports.variable = VariableContext;

VariableContext.prototype = new WidgetContext();

VariableContext.prototype.addParameter = function(parameter) {
	if(this.parameterFocus) {
		var name = this.setWidget.setName;
		var data = this.setWidget.variables[name];
		data.params.push({name: parameter});
	} else if (this.parent) {
		this.parent.addParameter(parameter);
	}
};
