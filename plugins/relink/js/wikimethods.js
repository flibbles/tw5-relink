/*\
module-type: wikimethod

Introduces some utility methods used by Relink.

\*/

var CannotRelinkError = require('$:/plugins/flibbles/relink/js/CannotRelinkError');

var relinkOperations = Object.create(null);
$tw.modules.applyMethods('relinkoperator', relinkOperations);

/**Walks through all non-shadow tiddlers and sees which ones need to be relinked
 *
 * For each one, calls method on it with arguments (changes, tiddler, title)
 * Returns a list of tiddlers it would fail to update.
 */
exports.eachRelinkableTiddler = function(fromTitle, toTitle, options, method) {
	fromTitle = (fromTitle || "").trim();
	toTitle = (toTitle || "").trim();
	var failures = [];
	if(fromTitle && toTitle && fromTitle !== toTitle) {
		this.each((tiddler,title) => {
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
						method(changes, tiddler, title);
					}
				} catch (e) {
					if (e instanceof CannotRelinkError) {
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
	return failures;
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

/**Returns a list of tiddlers that Relink would fail to update.
 */
exports.relinkTiddlerFailures = function(fromTitle, toTitle, options) {
	return this.eachRelinkableTiddler(
			fromTitle,
			toTitle,
			Object.assign({quiet: true}, options),
			function(changes, tiddler, title) {});
};
