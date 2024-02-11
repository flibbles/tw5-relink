/*\
title: $:/plugins/flibbles/relink-fieldnames/htmlFields.js
module-type: relinkhtml
type: application/javascript

This updates html attribute names which correspond to fields.

e.g.

<$action-createtiddler myfield="..." />

\*/

var utils = require("./utils.js");

exports.name = "fieldnames";

exports.report = function(element, parser, callback, options) {
	var regexp = parser.context.getConfig("fieldattributes")[element.tag];
	if (regexp) {
		for (var attributeName in element.attributes) {
			var results = regexp.exec(attributeName);
			if (results
			&& results[0] === attributeName
			&& !utils.isReserved(results[1], options)) {
				var attr = element.attributes[attributeName];
				var blurb;
				switch (attr.type) { 
				case "string":
					blurb = '"' + utils.abridgeString(attr.value, 33) + '"';
					break;
				case "indirect":
					blurb = "{{" + attr.textReference + "}}";
					break;
				case "filtered":
					blurb = "{{{" + utils.abridgeString(attr.filter, 33) + "}}}";
					break;
				case "macro":
					// Find the equals
					var equals = parser.source.indexOf("=", attr.start);
					// Now that the macrostart after that equals
					var macroStart = parser.source.indexOf("<", equals);
					blurb = "<<" + utils.abridgeString(parser.source.substring(macroStart+2, attr.end-2), 33) + ">>";
					break;
				}
				callback(results[1], element.tag + ' =' + blurb, {soft: true});
			}
		}
	}
};

exports.relink = function(element, parser, fromTitle, toTitle, options) {
	var entry = {};
	if (!utils.isReserved(fromTitle, options)) {
		var regexp = parser.context.getConfig("fieldattributes")[element.tag];
		if (regexp) {
			for (var attributeName in element.attributes) {
				var results = regexp.exec(attributeName);
				if (results
				&& results[0] === attributeName
				&& results[1] === fromTitle) {
					var newName = alterAttributeName(attributeName, fromTitle, toTitle, regexp, options);
					if (newName === undefined) {
						entry.impossible = true;
					} else {
						element.attributes[attributeName].name = newName;
						entry.output = true;
					}
				}
			}
		}
	}
	return entry;
};

// Returns undefined if it doesn't work out.
function alterAttributeName(attributeName, fromTitle, toTitle, regexp, options) {
	if (!utils.isReserved(toTitle, options)) {
		var newName = attributeName.replace(fromTitle, toTitle);
		var match = regexp.exec(newName);
		if (match && match[0] === newName && match[1] === toTitle) {
			// Taken from parseutils.js
			var reAttributeName = /([^\/\s>"'=]+)/;
			match = reAttributeName.exec(newName);
			if (match && match[0] === newName) {
				return newName;
			}
		}
	}
	return undefined;
};
