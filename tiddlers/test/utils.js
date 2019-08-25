/*\
module-type: library

Utilities for test.

\*/

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
	var relinkedTiddler;
	var wiki = options.wiki || new $tw.Wiki();
	var from = options.from || "from here";
	var to = options.to || "to there";
	wiki.addTiddler({title: from});
	options.log.push.apply(options.log,exports.collectLogs(function() {
		var tiddler = new $tw.Tiddler({title: "test"}, fields);
		var title = tiddler.fields.title;
		wiki.addTiddler(tiddler);
		wiki.renameTiddler(from, to, options);
		relinkedTiddler = wiki.getTiddler(title);
	}, options));
	return relinkedTiddler;
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
			expected = input.replace(new RegExp(from, "g"), to);
		}
	}
	options = options || {};
	options.wiki = options.wiki || new $tw.Wiki();
	return [input, expected, options];
};

/**Runs the given scope while swallowing any log messages.
 * Options:
 *   debug: if true, then this function doesn't divert messages.
 *          Useful to see output.
 * returns: Array of the emitted log messages.
 */
exports.collectLogs = function(scope, options) {
	options = options || {};
	var oldLog = console.log,
		logMessages = [];
	console.log = function (message) { logMessages.push(message); };
	if (options.debug) {
		console.log = oldLog;
	}
	try {
		scope.call();
	} finally {
		console.log = oldLog;
	}
	return logMessages;
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
