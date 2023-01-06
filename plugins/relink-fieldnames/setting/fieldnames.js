/*\

title: $:/plugins/flibbles/relink-fieldnames/setting/fieldnames.js
module-type: relinksetting
type: application/javascript

The setting module interfaces with the relink settings to store
a configuration for the blacklist.
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
