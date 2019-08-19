/*\

Handles all fields specified in the plugin configuration. Currently, this
only supports single-value fields.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var prefix = "$:/config/flibbles/relink/fields/";
var secretCache = "__relink_custom";

var utils = require('$:/plugins/flibbles/relink/js/utils.js');

exports['custom'] = function(tiddler, fromTitle, toTitle, changes, options) {
	var fields = getConfiguredFields(options);
	$tw.utils.each(fields, function(type, field) {
		var relink = utils.selectRelinker(type);
		var handler = new utils.FieldHandler(tiddler, field);
		var value = relink(handler, fromTitle, toTitle);
		if (value !== undefined) {
			changes[field] = value;
		}
	});
};

/**We're caching the list of custom fields inside options. Not exactly how
 * options was meant to be used, but it's fiiiiine.
 * The wiki global cache isn't a great place, because it'll get cleared many
 * times during a bulk relinking operation, and we can't recalculate this every
 * time without exploding a rename operation's time.
 * options works great. It only lasts just as long as the rename.
 * No longer, no shorter.
 */
function getConfiguredFields(options) {
	var fields = options[secretCache];
	if (fields === undefined) {
		fields = {};
		options.wiki.eachShadowPlusTiddlers(function(tiddler, title) {
			if (title.startsWith(prefix)) {
				var name = title.substr(prefix.length);
				fields[name] = tiddler.fields.text;
			}
		});
		options[secretCache] = fields;
	}
	return fields;
};
