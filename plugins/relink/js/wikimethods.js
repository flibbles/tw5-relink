/*\
module-type: wikimethod

Introduces some utility methods used by Relink.

\*/

var relinkOperations = Object.create(null);
$tw.modules.applyMethods('relinkoperator', relinkOperations);

/** Returns a pair like this,
 *  { title: {field: entry, ... }, ... }
 */
exports.getRelinkableTiddlers = function(fromTitle, toTitle, options) {
	var cache = this.getGlobalCache("relink-"+fromTitle, function() {
		return Object.create(null);
	});
	if (!cache[toTitle]) {
		cache[toTitle] = getFreshRelinkableTiddlers(this, fromTitle, toTitle, options);
	}
	return cache[toTitle];
};

function getFreshRelinkableTiddlers(wiki, fromTitle, toTitle, options) {
	options = options || {};
	options.wiki = options.wiki || wiki;
	fromTitle = (fromTitle || "").trim();
	toTitle = (toTitle || "").trim();
	var changeList = Object.create(null);
	if(fromTitle && toTitle && fromTitle !== toTitle) {
		var toUpdate = getRelinkFilter(wiki);
		var tiddlerList = toUpdate.call(wiki); // no source or widget
		for (var i = 0; i < tiddlerList.length; i++) {
			var title = tiddlerList[i];
			var tiddler = wiki.getTiddler(title);
			// Don't touch plugins or JavaScript modules
			if(tiddler
			&& !tiddler.fields["plugin-type"]
			&& tiddler.fields.type !== "application/javascript") {
				try {
					var entries = Object.create(null);
					for (var operation in relinkOperations) {
						relinkOperations[operation](tiddler, fromTitle, toTitle, entries, options);
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

function getRelinkFilter(wiki) {
	var toUpdate = "$:/config/flibbles/relink/to-update";
	return wiki.getCacheForTiddler(toUpdate, "relink-toUpdate", function() {
		var tiddler = wiki.getTiddler(toUpdate);
		if (tiddler) {
			var filter = wiki.compileFilter(tiddler.fields.text);
			return filter;
		} else {
			return wiki.allTitles;
		}
	});
};

/**Returns a list of tiddlers that would be renamed by a relink operations.
 */
exports.relinkTiddlerDryRun = function(fromTitle, toTitle, options) {
	var results = [];
	var records = this.getRelinkableTiddlers(fromTitle, toTitle, options);
	for (title in records) {
		results.push(title);
	};
	return results;
};

var ImportVariablesWidget = require("$:/core/modules/widgets/importvariables.js").importvariables;

exports.relinkGlobalMacros = function() {
	if (!this._relinkWidget) {
		var importWidget = this.relinkGenerateVariableWidget( "[[$:/core/ui/PageMacros]] [all[shadows+tiddlers]tag[$:/tags/Macro]!has[draft.of]]");
		this.addEventListener("change", function(changes) {
			importWidget.refresh(changes);
		});
		this._relinkWidget = importWidget;
	}
	var rtn = this._relinkWidget;
	while (rtn.children.length > 0) {
		rtn = rtn.children[0];
	}
	return rtn;
};

exports.relinkGenerateVariableWidget = function(filter, parent) {
	var treeNode = { attributes: {
		"filter": {
			type: "string",
			value: filter
		}
	}};
	var importWidget = new ImportVariablesWidget(treeNode,{parentWidget: parent, wiki: this});
	importWidget.computeAttributes();
	importWidget.execute();
	// These two functions neuter the widget, so it never tries
	// to render.
	importWidget.findNextSiblingDomNode = function() {};
	importWidget.renderChildren(this.parentDomNode);
	return importWidget;
};
