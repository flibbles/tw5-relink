/*\
module-type: relinkoperator
title: $:/plugins/flibbles/relink-variables/whitelist.js
type: application/javascript

Update the Relink whitelist for macro parameters.
\*/

var utils = require("$:/plugins/flibbles/relink/js/utils.js");
var varRelinker = utils.getType('variable');
var prefix = '$:/config/flibbles/relink/macros/';

exports.name = 'variable';

exports.report = function(tiddler, callback, options) {
	var title = tiddler.fields.title;
	if (title.substr(0, prefix.length) === prefix) {
		var key = title.substr(prefix.length);
		var name = dir(key);
		var macroParam = key.substr(name.length+1);
		varRelinker.report(name, function(title, blurb, style) {
			var type = tiddler.fields.text;
			callback(title, "#relink " + macroParam + ':' + type, style);
		}, options);
	}
};

exports.relink = function(tiddler, fromTitle, toTitle, changes, options) {
	var title = tiddler.fields.title;
	if (title.substr(0, prefix.length) === prefix) {
		var key = title.substr(prefix.length);
		var name = dir(key);
		var entry = varRelinker.relink(name, fromTitle, toTitle, options);
		if (entry) {
			if (entry.output) {
				entry.output = prefix + entry.output + key.substr(name.length);
			}
			changes.title = entry;
		}
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
