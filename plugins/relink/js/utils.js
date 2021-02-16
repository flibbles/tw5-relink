/*\
module-type: library

Utility methods for relink.

\*/

var relinkOperators;

function getRelinkOperators() {
	if (!relinkOperators) {
		relinkOperators = Object.create(null);
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
	}
	return relinkOperators;
};

exports.getTiddlerRelinkReferences = function(wiki, title, options) {
	var tiddler = wiki.getTiddler(title),
		references = Object.create(null),
		options = options || {};
	if (!options.settings) {
		options.settings = exports.getWikiContext(wiki);
	}
	options.wiki = wiki;
	if (tiddler) {
		for (var relinker in getRelinkOperators()) {
			getRelinkOperators()[relinker].report(tiddler, function(blurb, title) {
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
	options.settings = options.settings || exports.getWikiContext(wiki);
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
					for (var operation in getRelinkOperators()) {
						getRelinkOperators()[operation].relink(tiddler, fromTitle, toTitle, entries, options);
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

var Contexts = $tw.modules.applyMethods('relinkcontext');

exports.getContext = function(name) {
	return Contexts[name];
};

exports.getWikiContext = function(wiki) {
	// TODO: do I have any potential name conflicts with my use of cache keys?
	// This refreshes with every change, which is still too often. The indexer
	// is better. It may keep its version even if the global cache clears.
	return wiki.getGlobalCache('relink-context', function() {
		var whitelist = new Contexts.whitelist(wiki);
		var config = new Contexts.import(wiki, whitelist);
		config.import( "[[$:/core/ui/PageMacros]] [all[shadows+tiddlers]tag[$:/tags/Macro]!has[draft.of]]");
		return config;
	});
};

/**Returns a specific relinker.
 * This is useful for wikitext rules which need to parse a filter or a list
 */
exports.getType = function(name) {
	var Handler = getFieldTypes()[name];
	return Handler ? new Handler() : undefined;
};

exports.getTypes = function() {
	// We don't return fieldTypes, because we don't want it modified,
	// and we need to filter out legacy names.
	var rtn = Object.create(null);
	for (var type in getFieldTypes()) {
		var typeObject = getFieldTypes()[type];
		rtn[typeObject.typeName] = typeObject;
	}
	return rtn;
};

exports.getDefaultType = function(wiki) {
	var tiddler = wiki.getTiddler("$:/config/flibbles/relink/settings/default-type");
	var defaultType = tiddler && tiddler.fields.text;
	// make sure the default actually exists, otherwise default
	return fieldTypes[defaultType] ? defaultType : "title";
};

var fieldTypes;

function getFieldTypes() {
	if (!fieldTypes) {
		fieldTypes = Object.create(null);
		$tw.modules.forEachModuleOfType("relinkfieldtype", function(title, exports) {
			function NewType() {};
			NewType.prototype = exports;
			NewType.typeName = exports.name;
			fieldTypes[exports.name] = NewType;
			// For legacy, if the NewType doesn't have a report method, we add one
			if (!exports.report) {
				exports.report = function() {};
			}
			// Also for legacy, some of the field types can go by other names
			if (exports.aliases) {
				$tw.utils.each(exports.aliases, function(alias) {
					fieldTypes[alias] = NewType;
				});
			}
		});
	}
	return fieldTypes;
}

