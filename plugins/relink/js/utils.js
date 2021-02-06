/*\
module-type: library

Utility methods for relink.

\*/

var relinkOperators = Object.create(null);
$tw.modules.forEachModuleOfType('relinkoperator', function(title, module) {
	if (module.name !== undefined) {
		relinkOperators[module.name] = module;
	} else {
		// TODO: Maybe put some kind of warning message here that
		// this module needs to be updated?
		// Legacy support. It has a relinker, but not a reporter
		for (var entry in module) {
			relinkOperators[entry] = {
				relink: module[entry],
				report: function() {}};
		}
	}
});

exports.getTiddlerRelinkReferences = function(wiki, title) {
	var tiddler = wiki.getTiddler(title),
		references = Object.create(null),
	options = options || {};
	options.settings = wiki.getRelinkConfig();
	if (tiddler) {
		for (var relinker in relinkOperators) {
			relinkOperators[relinker].report(tiddler, function(blurb, title) {
				references[title] = references[title] || [];
				references[title].push(blurb);
			}, options);
		}
	}
	return references;
};

exports.getRelinkResults = function(wiki, fromTitle, toTitle, options) {
	options = options || {};
	options.wiki = options.wiki || wiki;
	options.settings = wiki.getRelinkConfig();
	fromTitle = (fromTitle || "").trim();
	toTitle = (toTitle || "").trim();
	var changeList = Object.create(null);
	if(fromTitle && toTitle) {
		var tiddlerList = wiki.getRelinkableTitles();
		for (var i = 0; i < tiddlerList.length; i++) {
			var title = tiddlerList[i];
			var tiddler = wiki.getTiddler(title);
			// Don't touch plugins or JavaScript modules
			if(tiddler
			&& !tiddler.fields["plugin-type"]
			&& tiddler.fields.type !== "application/javascript") {
				try {
					var entries = Object.create(null);
					for (var operation in relinkOperators) {
						relinkOperators[operation].relink(tiddler, fromTitle, toTitle, entries, options);
					}
					for (var field in entries) {
						// So long as there is one key,
						// add it to the change list.
						changeList[title] = entries;
						break;
					}
				} catch (e) {
					// Should we test for instanceof Error instead?: yes
					// Does that work in the testing environment?: no
					if (e.message) {
						e.message = e.message + "\nWhen relinking '" + title + "'";
					}
					throw e;
				}
			}
		}
	}
	return changeList;
};

