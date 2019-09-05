/*\
module-type: wikimethod

Introduces some utility methods used by Relink.

\*/

var errors = require('$:/plugins/flibbles/relink/js/errors');

var relinkOperations = Object.create(null);
$tw.modules.applyMethods('relinkoperator', relinkOperations);

/**Walks through all non-shadow tiddlers and sees which ones need to be relinked
 *
 * For each one, calls method on it with arguments (changes, tiddler, title)
 * Returns a list of tiddlers it would fail to update.
 */
exports.eachRelinkableTiddler = function(fromTitle, toTitle, options, method) {
	var data = this.getRelinkableTiddlers(fromTitle, toTitle, options);
	for (var title in data.changes) {
		method(data.changes[title], this.getTiddler(title), title);
	}
	return data.failures;
};

/** Returns a pair like this,
 *  { changes: {...}, failures: [] }
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
	var failures = [];
	var changeList = Object.create(null);
	if(fromTitle && toTitle && fromTitle !== toTitle) {
		wiki.each((tiddler,title) => {
			var type = tiddler.fields.type || "";
			// Don't touch plugins or JavaScript modules
			if(!tiddler.fields["plugin-type"] && type !== "application/javascript") {
				try {
					var changes = {};
					for (var operation in relinkOperations) {
						relinkOperations[operation](tiddler, fromTitle, toTitle, changes, options);
					}
					// If any fields changed, update tiddler
					if(Object.keys(changes).length > 0) {
						changeList[title] = changes;
					}
				} catch (e) {
					if (e instanceof errors.RelinkError) {
						failures.push(title);
					} else {
						// Should we test for instanceof Error instead?: yes
						// Does that work in the testing environment?: no
						if (e.message) {
							e.message = e.message + "\nWhen relinking '" + title + "'";
						}
						throw e;
					}
				}
			}
		});
	}
	return {changes: changeList, failures: failures};
};

/**Returns a list of tiddlers that would be renamed by a relink operations.
 */
exports.relinkTiddlerDryRun = function(fromTitle, toTitle, options) {
	var results = [];
	this.eachRelinkableTiddler(
			fromTitle,
			toTitle,
			options,
			function(changes, tiddler, title) {
		results.push(title);
	});
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
	importWidget.renderChildren = function() {};
	return importWidget;
};
