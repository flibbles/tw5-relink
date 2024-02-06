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
	var name = element.attributes[nameAttr].value;
	callback(utils.prefix + name, element.tag);
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
	var cleanFrom = utils.removePrefix(fromTitle);
	if (cleanFrom !== null) {
		var attr = element.attributes[nameAttr];
		var name = attr.value;
		if (name === cleanFrom) {
			var cleanTo = utils.removePrefix(toTitle);
			if (!cleanTo) {
				return {impossible: true};
			}
			attr.value = cleanTo;
			return {output: true};
		}
	}
};
