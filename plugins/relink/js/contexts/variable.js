/*\

This handles the context for variables. Either from $set, $vars, or \define

\*/

var WidgetContext = require('./widget').widget;

function VariableContext(parent, setParseTreeNode) {
	this.parent = parent;
	// Now create a new widget and attach it.
	var attachPoint = parent.widget;
	var setWidget = attachPoint.makeChildWidget(setParseTreeNode);
	setWidget.computeAttributes();
	setWidget.execute();
	// point our widget to bottom, where any other contexts would attach to
	//TODO: Maybe this part can be moved into widgetContext.
	this.widget = setWidget;
	while (this.widget.children.length > 0) {
		this.widget = this.widget.children[0];
	}
};

exports.variable = VariableContext;

VariableContext.prototype = new WidgetContext();
