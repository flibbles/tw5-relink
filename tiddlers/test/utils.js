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
	wiki.addTiddlers(exports.setupTiddlers());
	results.from = options.from || "from here";
	results.to = options.to || "to there";
	wiki.addTiddler({title: results.from});
	results.log = exports.collect("log", function() {
	results.warn = exports.collect("warn", function() {
	results.fails = exports.collectFailures(function() {
		var tiddler = new $tw.Tiddler({title: "test"}, fields);
		var title = tiddler.fields.title;
		wiki.addTiddler(tiddler);
		wiki.renameTiddler(results.from, results.to, options);
		results.tiddler = wiki.getTiddler(title);
	});
	});
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
	var oldOutput = console[output],
		messages = [];
	console[output] = function (message) { messages.push(message); };
	try {
		scope.call();
	} finally {
		console[output] = oldOutput;
	}
	return messages;
};

exports.collectFailures = function(scope) {
	var oldReport = language.reportFailures,
		failures = [];
	language.reportFailures= function (list) { failures.push.apply(failures, list); };
	try {
		scope.call();
	} finally {
		language.reportFailures = oldReport;
	}
	return failures;
};

/**Returns the placeholder pragma
 *
 * There are times when Relink can't relink in place, so it has to resort
 * to using macros. This is the macro pattern.
 */
exports.placeholder = function(number, value, newline) {
	newline = newline || '\n'
	return `\\define relink-${number}() ${value}${newline}`;
};

exports.attrConf = function(element, attribute, type) {
	var prefix = "$:/config/flibbles/relink/attributes/";
	return {title: prefix + element + "/" + attribute, text: type};
};

/**Returns a configuration tiddler for a filter operator.
 */
exports.operatorConf = function(operator, value) {
	if (value === undefined) {
		value = "title";
	}
	var prefix = "$:/config/flibbles/relink/operators/";
	return {title: prefix + operator, text: value};
};

exports.fieldConf = function(field, type) {
	var prefix =  "$:/config/flibbles/relink/fields/";
	return {title: prefix + field, text: type};
};
