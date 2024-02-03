/*\

Factory method for creating the message regexp cache.

\*/

exports.name = "messages";

exports.generate = function(messages, tiddler, key) {
	messages[key] = new RegExp(tiddler.fields.text.trim());
};
