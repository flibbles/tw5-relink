/*\
module-type: relinkhtml
title: $:/plugins/flibbles/relink-variables/html.js
type: applications/javascript

Sets up rule for $transclude and $macrocall

\*/

'use strict';

var utils = require("./utils.js");

exports.name = "variables";

exports.report = function(element, parser, callback, options) {
	var nameAttr;
	switch (element.tag) {
	case "$transclude":
		nameAttr = "$variable";
		break;
	case "$macrocall":
		nameAttr = "$name";
		break;
	default:
		return;
	}
	var nameAttr = element.attributes[nameAttr];
	if (nameAttr) {
		var name = nameAttr.value;
		var def = options.settings.getMacroDefinition(name);
		if (def) {
			callback(utils.prefix + def.tiddler + ' ' + name, element.tag);
		}
	}
};

exports.relink = function(element, parser, fromTitle, toTitle, options) {
	var nameAttr;
	switch (element.tag) {
	case "$transclude":
		nameAttr = "$variable";
		break;
	case "$macrocall":
		nameAttr = "$name";
		break;
	default:
		return;
	}
	var attr = element.attributes[nameAttr];
	if (attr) {
		var cleanFrom = utils.removePrefix(fromTitle);
		if (cleanFrom !== null) {
			var name = attr.value;
			var def = options.settings.getMacroDefinition(name);
			if (def) {
				if (cleanFrom === def.tiddler + ' ' + name) {
					var cleanTo = utils.removePrefix(toTitle, def.tiddler);
					if (!cleanTo) {
						return {impossible: true};
					}
					attr.value = cleanTo;
					return {output: true};
				}
			}
		}
	}
};
