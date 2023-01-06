/*\

Factory method for creating the fieldattributes regexp cache.

\*/

exports.name = "fieldattributes";

exports.generate = function(fieldattributes, tiddler, key) {
	fieldattributes[key] = new RegExp(tiddler.fields.text.trim());
};
