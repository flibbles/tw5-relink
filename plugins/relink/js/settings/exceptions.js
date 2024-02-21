/*\

Factory method for specifying system tiddlers which should not be treated
as text/vnd.tiddlywiki types, but for whatever reason, they don't specify
the type they really are. Sort of like how $:/DefaultTiddlers is actually
a filter.

\*/

exports.name = "exceptions";

exports.generate = function(exceptions, tiddler, title) {
	var tiddlerType = tiddler.fields.text.trim();
	if (tiddlerType) {
		exceptions[title] = tiddlerType;
	}
};
