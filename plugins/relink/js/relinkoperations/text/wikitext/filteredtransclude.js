/*\
module-type: relinkwikitextrule

Handles replacement of filtered transclusions in wiki text like,

{{{ [tag[docs]] }}}
{{{ [tag[docs]] |tooltip}}}
{{{ [tag[docs]] ||TemplateTitle}}}
{{{ [tag[docs]] |tooltip||TemplateTitle}}}
{{{ [tag[docs]] }}width:40;height:50;}.class.class

This renames both the list and the template field.

\*/

exports.name = ['filteredtranscludeinline', 'filteredtranscludeblock'];

var filterHandler = require("$:/plugins/flibbles/relink/js/settings").getRelinker('filter');
var log = require('$:/plugins/flibbles/relink/js/language.js').logRelink;
var utils = require("./utils.js");

exports.relink = function(tiddler, text, fromTitle, toTitle, options) {
	var m = this.match;
		filter = m[1],
		tooltip = m[2],
		template = m[3],
		style = m[4],
		classes = m[5],
		logArguments = {
			from: fromTitle,
			to: toTitle,
			tiddler: tiddler.fields.title
		};
	this.parser.pos = this.matchRegExp.lastIndex;
	var modified = false;
	if ($tw.utils.trim(template) === fromTitle) {
		// preserves user-inputted whitespace
		template = template.replace(fromTitle, toTitle);
		modified = true;
	}
	var relinkedFilter = filterHandler(filter, fromTitle, toTitle, options);
	if (relinkedFilter !== undefined) {
		filter = relinkedFilter;
		modified = true;
	}
	if (modified) {
		if (canBePretty(filter) && canBePrettyTemplate(template)) {
			log("filteredtransclude", logArguments);
			return prettyList(filter, tooltip, template, style, classes);
		} else {
			log("filteredtransclude-widget", logArguments);
			return widgetList(this.parser, filter, tooltip, template, style, classes);
		}
	}
	return undefined;
};

function canBePretty(filter) {
	return filter.indexOf('|') < 0 && filter.indexOf('}}') < 0;
};

function canBePrettyTemplate(template) {
	return !template || (
		template.indexOf('|') < 0
		&& template.indexOf('{') < 0
		&& template.indexOf('}') < 0);
};

function prettyList(filter, tooltip, template, style, classes) {
	if (tooltip === undefined) {
		tooltip = '';
	} else {
		tooltip = "|" + tooltip;
	}
	if (template === undefined) {
		template = '';
	} else {
		template = "||" + template;
	}
	if (classes === undefined) {
		classes = '';
	} else {
		classes = "." + classes;
	}
	style = style || '';
	return `{{{${filter}${tooltip}${template}}}${style}}${classes}`;
};

function widgetList(wikiRelinker, filter, tooltip, template, style, classes) {
	if (classes !== undefined) {
		classes = classes.split('.').join(' ');
	}
	return [
		"<$list",
		utils.wrapAttribute(wikiRelinker, "filter", filter),
		utils.wrapAttribute(wikiRelinker, "tooltip", tooltip),
		utils.wrapAttribute(wikiRelinker, "template", template),
		utils.wrapAttribute(wikiRelinker, "style", style),
		utils.wrapAttribute(wikiRelinker, "itemClass", classes),
		"/>"
	].join('');
};
