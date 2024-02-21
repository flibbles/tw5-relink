/*\

Base class for relink contexts.

\*/

function Context() {
};

exports.context = Context;

// This class does no special handling of fields, operators, or attributes.
// we pass it along to the parent.
Context.prototype.getFields = function() {
	return this.parent.getFields();
};

Context.prototype.getOperator = function(name, index) {
	return this.parent.getOperator(name, index);
};

Context.prototype.getOperators = function() {
	return this.parent.getOperators();
};

Context.prototype.getAttribute = function(elementName) {
	return this.parent.getAttribute(elementName);
};

Context.prototype.getAttributes = function() {
	return this.parent.getAttributes();
};

Context.prototype.getConfig = function(category) {
	return this.parent.getConfig(category);
};

Context.prototype.getMacro = function(macroName) {
	return this.parent.getMacro(macroName);
};

Context.prototype.getMacros = function() {
	return this.parent.getMacros();
};

/* Exceptions are tiddlers that have text/vnd.tiddlywiki type, but should
 * not be treated as such.
 */
Context.prototype.getException = function(tiddlerTitle) {
	return this.parent.getException(tiddlerTitle);
};

Context.prototype.allowPrettylinks = function() {
	return this.parent.allowPrettylinks();
};

Context.prototype.allowWidgets = function() {
	return this.parent.allowWidgets();
};

Context.prototype.hasImports = function(value) {
	return this.parent.hasImports(value);
};

Context.prototype.getFocus = function() {
	if (this.parent) {
		return this.parent.getFocus();
	}
};

Context.prototype.getPlaceholderList = function() {
	if (this.parent) {
		return this.parent.getPlaceholderList();
	}
	return null;
};

Context.prototype.addParameter = function(parameter) {
	if(this.parent) {
		return this.parent.addParameter(parameter);
	}
};
