/*\

title: $:/plugins/flibbles/relink-fieldnames/whitelist.js
module-type: relinkwhitelist
type: application/javascript

The whitelist module interfaces with the relink whitelist settings to store
a configuration for the... uh... blacklist. Go figure.
\*/

exports.name = "fieldnames";

exports.generate = function(settings, tiddler, key, wiki) {
	if (key === "blacklist") {
		var tiddlers = wiki.filterTiddlers(tiddler.fields.filter);
		var fieldMap = Object.create(null);
		for (var i = 0; i < tiddlers.length; i++) {
			fieldMap[tiddlers[i]] = true;
		}
		settings.blacklist = function(field) {
			return fieldMap[field] || false;
		};
	}
	// else { I don't know what else there could be... }
};
