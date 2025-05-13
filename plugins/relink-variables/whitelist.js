/*\
module-type: relinkprefix
title: $:/plugins/flibbles/relink-variables/whitelist.js
type: application/javascript

Update the Relink whitelist for macro parameters.
\*/

var utils = require("$:/plugins/flibbles/relink/js/utils.js");
var varRelinker = utils.getType('variable');

exports.prefix = '$:/config/flibbles/relink/macros/';

exports.report = function(tiddler, callback, options) {
	var key = tiddler.fields.title.substr(exports.prefix.length);
	var name = dir(key);
	var macroParam = key.substr(name.length+1);
	varRelinker.report(name, function(title, blurb, style) {
		var type = tiddler.fields.text;
		callback(title, "#relink " + macroParam + ':' + type, style);
	}, options);
};

exports.relink = function(tiddler, fromTitle, toTitle, changes, options) {
	var key = tiddler.fields.title.substr(exports.prefix.length);
	var name = dir(key);
	var entry = varRelinker.relink(name, fromTitle, toTitle, options);
	if (entry) {
		if (entry.output) {
			entry.output = exports.prefix + entry.output + key.substr(name.length);
		}
		changes.title = entry;
	}
};

/* Returns all but the last bit of a path. path/to/tiddler -> path/to
 */
function dir(string) {
    var index = string.lastIndexOf('/');
    if (index >= 0) {
        return string.substr(0, index);
    }
};
