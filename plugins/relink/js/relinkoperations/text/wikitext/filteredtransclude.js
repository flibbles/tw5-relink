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

var filterHandler = require("$:/plugins/flibbles/relink/js/utils").getType('filter');
var utils = require("./utils.js");
var EntryNode = require('$:/plugins/flibbles/relink/js/utils/entry');

var FilteredTranscludeEntry = EntryNode.newType("filteredtransclude");

FilteredTranscludeEntry.prototype.report = function() {
	var output = [];
	var self = this;
	$tw.utils.each(this.children, function(child) {
		if (child.name === "filter") {
			var append = "}}}";
			if (self.template) {
				append = "||" + self.template + append;
			}
			$tw.utils.each(child.report(), function(report) {
				output.push("{{{" + report + append);
			});
		} else {
			// Must be the template
			output.push("{{{" + self.filter + "||}}}");
		}
	});
	return output;
};

exports.report = function(text, callback, options) {
	var m = this.match,
		filter = m[1],
		template = $tw.utils.trim(m[3]),
		append = template ? '||' + template + '}}}' : '}}}';
	filterHandler.report(filter, function(blurb, title) {
		callback('{{{' + blurb + append, title);
	}, options);
	if (template) {
		callback('{{{' + $tw.utils.trim(filter).replace(/\r?\n/mg, ' ') + '||}}}', template);
	}
	this.parser.pos = this.matchRegExp.lastIndex;
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var m = this.match,
		filter = m[1],
		tooltip = m[2],
		template = m[3],
		style = m[4],
		classes = m[5],
		parser = this.parser,
		entry = new FilteredTranscludeEntry();
	parser.pos = this.matchRegExp.lastIndex;
	var modified = false;

	var filterEntry = filterHandler.relink(filter, fromTitle, toTitle, options);
	if (filterEntry !== undefined) {
		entry.add(filterEntry);
		if (filterEntry.output) {
			modified = true;
			filter = filterEntry.output;
		}
	}

	if ($tw.utils.trim(template) === fromTitle) {
		// preserves user-inputted whitespace
		template = template.replace(fromTitle, toTitle);
		entry.add({name: "title", output: template});
		modified = true;
	}
	if (!modified) {
		if (entry.children.length <= 0) {
			return undefined;
		}
	} else {
		var output = this.makeFilteredtransclude(this.parser.context, filter, tooltip, template, style, classes, options);
		if (output === undefined) {
			entry.impossible = true;
		} else {
			// By copying over the ending newline of the original
			// text if present, thisrelink method thus works for
			// both the inline and block rule
			entry.output = output + utils.getEndingNewline(m[0]);
		}
		entry.filter = filter;
	}
	entry.template = template;
	return entry;
};

exports.makeFilteredtransclude = function(context, filter, tooltip, template, style, classes, options) {
	if (canBePretty(filter) && canBePrettyTemplate(template)) {
		return prettyList(filter, tooltip, template, style, classes);
	} else if (context.allowWidgets()) {
		if (classes !== undefined) {
			classes = classes.split('.').join(' ');
		}
		return utils.makeWidget('$list', {
			filter: filter,
			tooltip: tooltip,
			template: template,
			style: style || undefined,
			itemClass: classes}, undefined, options);
	}
	return undefined;
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
	return "{{{"+filter+tooltip+template+"}}"+style+"}"+classes;
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
