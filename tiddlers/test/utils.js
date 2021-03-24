/*\
module-type: library

Utilities for test.

\*/

var language = require('$:/plugins/flibbles/relink/js/language.js');

/**Most common test method.
 * Given a list of fields, it creates a test tiddler, and then performs a
 * rename of a dummy tiddler (default: "from here" -> "to there") and
 * returns the modified test tiddler for examination.
 * Options:
 *   wiki: specifies custom Wiki. Useful to include settings tiddlers.
 *   target: this is the tiddler being relinked. (default: "test")
 *   from: specifies the dummy tiddler's initial name (default: "from here")
 *   to: specifies dummy tiddler's final name (default: "to there")
 *   log: OUTPUT: This is an array where the log output will be stored.
          options must be given for this to be recoverable.
 *  Additionally, the options are passed to all internal methods.
 */
exports.relink = function(fields, options) {
	options = options || {};
	options.log = options.log || [];
	var results = {};
	var relinkedTiddler;
	var wiki = options.wiki || new $tw.Wiki();
	var target = options.target || "test";
	wiki.addTiddlers(exports.setupTiddlers());
	results.wiki = wiki;
	results.from = options.from || "from here";
	results.to = options.to || "to there";
	if (!wiki.getTiddler(results.from)) {
		// There are a couple tests that add the "from" tiddler
		// themselves. So we want to make sure not to override them.
		wiki.addTiddler({title: results.from, type: options.type});
	}
	results.fails = exports.collectFailures(function() {
		var tiddler = new $tw.Tiddler({title: target}, fields);
		var title = tiddler.fields.title;
		wiki.addTiddler(tiddler);
		wiki.renameTiddler(results.from, results.to, options);
		results.tiddler = wiki.getTiddler(title);
	});
	return results;
};

/** Returns a list of fields that can be added to a wiki for a default config.
 */
exports.setupTiddlers = function() {
	return [
		exports.attrConf("$link", "to", "title"),
		exports.attrConf("$list", "filter", "filter"),
		exports.fieldConf("list", "list"),
		exports.fieldConf("tags", "list"),
		exports.fieldConf("filter", "filter"),
		exports.fieldConf("list-after", "title"),
		exports.fieldConf("list-before", "title"),
		exports.operatorConf("title"),
		exports.operatorConf("field:title"),
		exports.operatorConf("tag"),
		exports.operatorConf("list", "reference")
	];
};

/**Prepares arguments for a common testing pattern.
 * If a helper method takes an input string, an expected string,
 * and some options, this prepares the arguments so that the expecte string
 * and the options is optional.
 * Options:
 *   ignored: If the expected string is not given, assume input === expected
 */
exports.prepArgs = function(input, expected, options) {
	if (typeof expected !== "string" && options === undefined) {
		options = expected || {};
		if (options && options.ignored) {
			expected = input;
		} else {
			var from = options.from || "from here";
			var to = options.to || "to there";
			expected = input.split(from).join(to);
		}
	}
	options = options || {};
	options.wiki = options.wiki || new $tw.Wiki();
	return [input, expected, options];
};

/**Runs the given scope while swallowing any console messages of a given type.
 * param output: "log", "warn", "error", ...
 * Options:
 *   debug: if true, then this function doesn't divert messages.
 *          Useful to see output.
 * returns: Array of the emitted log messages.
 */
exports.collect = function(output, scope) {
	var messages = [];
	function pusher(message) { messages.push(message); };
	this.monkeyPatch(console, output, pusher, function() {
		scope.call();
	});
	return messages;
};

exports.collectFailures = function(scope) {
	var failures = [];
	function newReport(list) { failures.push.apply(failures, list); };
	this.monkeyPatch(language, "reportFailures", newReport, function() {
		scope.call();
	});
	return failures;
};

/** This allows some method to be swapped out with a mock method for the
 *  purpose of testing a block. Afterward, it replaces the old method.
 */
exports.monkeyPatch = function(container, method, alternative, block) {
	var old = container[method];
	container[method] = alternative;
	try {
		block();
	} finally {
		container[method] = old;
	}
};

/** Flushes any enqueued events in Tiddlywiki. So all pending changes get
 *  written.
 */
exports.flush = function(wiki) {
	return new Promise(function(resolve, reject) {
		$tw.utils.nextTick(resolve);
	});
};

exports.version = function() {
	// Shouldn't matter if it says prerelease or anything like that
	return parseInt($tw.version.split('.')[2]);
};

exports.addPlugin = function(pluginName, tiddlers, options) {
	options = options || {};
	var wiki = options.wiki || new $tw.Wiki();
	var tiddlerHash = Object.create(null);
	$tw.utils.each(tiddlers, function(hash) {
		tiddlerHash[hash.title] = hash;
	});
	var content = { tiddlers: tiddlerHash }
	wiki.addTiddler({
		title: pluginName,
		type: "application/json",
		"plugin-type": "plugin",
		description: options.description || undefined,
		text: JSON.stringify(content)});
	wiki.registerPluginTiddlers("plugin");
	wiki.readPluginInfo();
	wiki.unpackPluginTiddlers();
	return wiki;
};

/**Returns the placeholder pragma
 *
 * There are times when Relink can't relink in place, so it has to resort
 * to using macros. This is the macro pattern.
 */
exports.placeholder = function(number, value, multiline, newline) {
	newline = newline || '\n'
	if (multiline) {
		return `\\define relink-${number}()${newline}${value}${newline}\\end${newline}`;
	} else {
		return `\\define relink-${number}() ${value}${newline}`;
	}
};

exports.attrConf = function(element, attribute, type) {
	var prefix = "$:/config/flibbles/relink/attributes/";
	if (type === undefined) {
		type = "title";
	}
	return {title: prefix + element + "/" + attribute, text: type};
};

exports.fieldConf = function(field, type) {
	var prefix =  "$:/config/flibbles/relink/fields/";
	if (type === undefined) {
		type = "title";
	}
	return {title: prefix + field, text: type};
};

exports.macroConf = function(macro, argument, type) {
	if (type === undefined) {
		type = "title";
	}
	var prefix =  "$:/config/flibbles/relink/macros/";
	return {title: prefix + macro + "/" + argument, text: type};
};

/**Returns a configuration tiddler for a filter operator.
 */
exports.operatorConf = function(operator, type, argNumber) {
	if (type === undefined) {
		type = "title";
	}
	var argSuffix = '';
	if (argNumber !== undefined) {
		argSuffix = '/' + argNumber;
	}
	var prefix = "$:/config/flibbles/relink/operators/";
	return {title: prefix + operator + argSuffix, text: type};
};

exports.toUpdateConf = function(filter) {
	return {title: "$:/config/flibbles/relink/to-update", text: filter};
};

exports.draft = function(fields) {
	const newFields = $tw.utils.extend({
		'draft.of': fields.title,
		'draft.title': fields.title}, Object.create(null), fields);
	newFields.title = "Draft of '" + fields.title + "'";
	return newFields;
};

/**Gets report on a given tiddler.
 */
exports.getReport = function(title, wiki) {
	wiki = wiki || $tw.wiki;
	return wiki.getTiddlerRelinkReferences(title);
};

/** Gets the text of a tiddler.
 */
exports.getText = function(title, wiki) {
	wiki = wiki || $tw.wiki;
	return wiki.getTiddler(title).fields.text;
};
