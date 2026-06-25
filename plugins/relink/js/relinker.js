/*\
module-type: relinker

Replaces the core `relinker` module of: $:/core/modules/relinkers/tiddlers.js
with one that plugs into all of Relink.

We replace instead of making an independent module because we want to override
the core relinking of `list` and `tags` with our own more adaptable system.

Other plugins can introduce their own relinking now without needing (or being
incompatible with) Relink by introducing their own `relinker` modules.

\*/

"use strict";

var language = require('$:/plugins/flibbles/relink/js/language.js');
var utils = require("$:/plugins/flibbles/relink/js/utils.js");

exports.name = "tiddlers";

/** Walks through all relinkable tiddlers and relinks them.
 *  This replaces the existing module in core Tiddlywiki.
 */
exports.relink = function(wiki, fromTitle, toTitle, options) {
	options = options || {};
	var failures = [];
	var indexer = utils.getIndexer(wiki);
	var records = indexer.relinkLookup(fromTitle, toTitle, options);
	var changedTitles = Object.create(null);
	for (var title in records) {
		var entries = records[title],
			changes = Object.create(null),
			update = false,
			fails = false;
		for (var field in entries) {
			var entry = entries[field];
			fails = fails || entry.impossible;
			if (entry.output !== undefined) {
				changes[field] = entry.output;
				update = true;
			}
		}
		if (fails) {
			failures.push(title);
		}
		// If any fields changed, update tiddler
		if (update) {
			console.log("Renaming '"+fromTitle+"' to '"+toTitle+"' in '" + title + "'");

			var tiddler = wiki.getTiddler(title);
			var modifyField = utils.touchModifyField(wiki) ? wiki.getModificationFields() : undefined;
			var newTiddler = new $tw.Tiddler(tiddler,changes,modifyField)
			newTiddler = $tw.hooks.invokeHook("th-relinking-tiddler",newTiddler,tiddler);
			wiki.addTiddler(newTiddler);
			// If the title changed, we need to perform a nested rename
			if (newTiddler.fields.title !== title) {
				changedTitles[title] = newTiddler.fields.title;
			}
		}
	};
	// Now that the rename is complete, we must now rename any tiddlers that
	// changed their titles, and thus repeat the process.
	for (var title in changedTitles) {
		wiki.deleteTiddler(title);
		wiki.relinkTiddler(title, changedTitles[title], options);
	}
	if (failures.length > 0) {
		var options = $tw.utils.extend(
			{ variables: {to: toTitle, from: fromTitle},
			  wiki: wiki},
			options );
		language.reportFailures(failures, options);
	}
};
