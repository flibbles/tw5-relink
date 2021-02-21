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

Context.prototype.getOperators = function() {
	return this.parent.getOperators();
};

Context.prototype.getAttribute = function(elementName) {
	return this.parent.getAttribute(elementName);
};

Context.prototype.getAttributes = function() {
	return this.parent.getAttributes();
};

Context.prototype.getMacro = function(macroName) {
	return this.parent.getMacro(macroName);
};

Context.prototype.getMacros = function() {
	return this.parent.getMacros();
};

Context.prototype.survey = function(text, fromTitle, options) {
	return this.parent.survey(text, fromTitle, options);
};

Context.prototype.noPrettylinks = function() {
	return this.parent && this.parent.noPrettylinks();
};

Context.prototype.noWidgets = function() {
	return this.parent && this.parent.noWidgets();
};
