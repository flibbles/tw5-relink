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
		parser = this.parser,
		logArguments = {
			from: fromTitle,
			to: toTitle,
			tiddler: tiddler.fields.title
		};
	parser.pos = this.matchRegExp.lastIndex;
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
	if (!modified) {
		return undefined;
	}
	if (canBePretty(filter) && canBePrettyTemplate(template)) {
		log("filteredtransclude", logArguments);
		return prettyList(filter, tooltip, template, style, classes);
	}
	var message = "filteredtransclude-widget";
	if (classes !== undefined) {
		classes = classes.split('.').join(' ');
	}
	function wrap(name, value, treatAsTitle) {
		if (!value) {
			return '';
		}
		var wrappedValue = utils.wrapAttributeValue(value, "'");
		if (wrappedValue === undefined) {
			var category = treatAsTitle ? undefined : name;
			wrappedValue = parser.getPlaceholderFor(value,category);
			message = "filteredtransclude-placeholder";
		}
		return ` ${name}=${wrappedValue}`;
	};
	var widget = [
		"<$list",
		wrap("filter", filter),
		wrap("tooltip", tooltip),
		wrap("template", template, true),
		wrap("style", style),
		wrap("itemClass", classes),
		"/>"
	].join('');
	log(message, logArguments);
	return widget;
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
