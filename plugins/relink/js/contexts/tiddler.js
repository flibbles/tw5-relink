/*\

Context for a tiddler. Defines nothing but makes an entry point to test if
a tiddler must be refreshed.

\*/

var Context = require('./context.js').context;

function TiddlerContext(wiki, parentContext, title) {
	this.title = title;
	this.parent = parentContext;
	var globalWidget = parentContext && parentContext.widget;
	var parentWidget = wiki.makeWidget(null, {parentWidget: globalWidget});
	parentWidget.setVariable('currentTiddler', title);
	this.widget = wiki.makeWidget(null, {parentWidget: parentWidget});
};

exports.tiddler = TiddlerContext;

TiddlerContext.prototype = new Context();

// TODO: Repetition here. So many contexts define this same method
TiddlerContext.prototype.getMacroDefinition = function(variableName) {
	// widget.variables is prototyped, so it looks up into all its parents too
	return this.widget.variables[variableName] || $tw.macros[variableName];
};
