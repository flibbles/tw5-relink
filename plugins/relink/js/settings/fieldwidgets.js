/*\

Factory method for creating the fieldwidget regexp cache.

\*/

exports.name = "fieldwidgets";

exports.generate = function(fieldwidgets, tiddler, key) {
	fieldwidgets[key] = new RegExp(tiddler.fields.text.trim());
};
