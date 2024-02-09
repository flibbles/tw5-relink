/*\
module-type: relinkfieldtype
title: $:/plugins/flibbles/relink-variables/fieldtype.js
type: application/javascript

This manages the variable type, which is like list, wikitext, markdown, etc...
Except that this type points to a variable, not a tiddler.

\*/

var systemPrefix = "$:/temp/flibbles/relink-variables/";

exports.name = 'variable';

exports.report = function(value, callback, options) {
	var def = options.settings.getMacroDefinition(value);
	if (def && def.tiddler) {
		// variable reports are soft, because the made-up tiddlers that act as
		// directives for the variable shouldn't flood the "Missing" panel.
		callback(systemPrefix + def.tiddler + ' ' + value, undefined, {soft: true});
	}
};

exports.reportForTitle = function(value, callback, defTitle) {
	callback(systemPrefix + defTitle + ' ' + value, undefined, {soft: true});
};

exports.relink = function(value, fromTitle, toTitle, options) {
	var def = options.settings.getMacroDefinition(value);
	if (def) {
		return this.relinkForTitle(value, fromTitle, toTitle, def.tiddler);
	}
};

exports.relinkForTitle = function(value, fromTitle, toTitle, defTitle) {
	var prefix = systemPrefix + defTitle + ' ';
	if (fromTitle === prefix + value) {
		if (toTitle.substr(0, prefix.length) !== prefix
		|| toTitle.indexOf(' ', prefix.length) >= 0
		|| toTitle.indexOf('(', prefix.length) >= 0) {
			return {impossible: true};
		} else {
			return {output: toTitle.substr(prefix.length)};
		}
	}
};
