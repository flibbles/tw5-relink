/*\
module-type: relinkwikitextrule

Handles replacement of inline mvv displays like:

((docs))
((docs||separator))
((( [tag[docs]] )))
((([tag[docs]]||separator)))

\*/

exports.name = 'mvvdisplayinline';

var filterHandler = require("$:/plugins/flibbles/relink/js/utils").getType('filter');
var macrocallHandler = require('$:/plugins/flibbles/relink/js/utils/macrocall.js');
var utils = require("./utils.js");

exports.report = function(text, callback, options) {
	var m = this.nextMatch,
		separator = m.separator !== ', '? '||' + m.separator: '',
		nestedOptions = Object.create(options);
	nestedOptions.settings = this.parser.context;
	if (m.type === "variable") {
		var macro = $tw.utils.parseMacroInvocation("<<" + m.varName + ">>", 0);
		macrocallHandler.report(this.parser.context, macro, function(title, blurb, style) {
			callback(title, '((' + blurb + separator + '))', style);
		}, nestedOptions);
	} else {
		filterHandler.report(m.filter, function(title, blurb, style) {
			callback(title, '(((' + blurb + append + ')))', style);
		}, nestedOptions);
	}
	this.parser.pos = m.end;
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var m = this.nextMatch,
		modified = false,
		separator = m.separator !== ', '? '||' + m.separator: '',
		nestedOptions = Object.create(options);
	nestedOptions.settings = this.parser.context;
	this.parser.pos = m.end;
	if (m.type === "variable") {
		var text = '<<' + m.varName + '>>';
		//var macro = $tw.utils.parseMVVReferenceAsTransclusion(text, 0);
		var macro = $tw.utils.parseMacroInvocation("<<"+m.varName+">>", 0);
		//macro.params = macro.orderedAttributes;
		//macro.name = macro.attributes['$variable'].value;
		var entry = macrocallHandler.relink(this.parser.context, macro, text, fromTitle, toTitle, nestedOptions);
		if (entry !== undefined) {
			if (entry.output) {
				var macro = macrocallHandler.reassemble(entry, text, nestedOptions);
				var innards = macro.substring(2, macro.length-2);
				if (innards.search(/[()|]/) >= 0) {
					entry.output = undefined;
					entry.impossible = true;
				} else {
					entry.output = '((' + innards + separator + '))';
					modified = true;
				}
			}
		}
	} else {
		var output = this.makeFilteredtransclude(this.parser, filter, tooltip, template, style, classes);
		if (output === undefined) {
			entry.impossible = true;
		} else {
			// By copying over the ending newline of the original
			// text if present, thisrelink method thus works for
			// both the inline and block rule
			entry.output = output + utils.getEndingNewline(m[0]);
		}
	}
	return entry;
};

exports.makeFilteredtransclude = function(parser, filter, tooltip, template, style, classes) {
	if (canBePretty(filter) && canBePrettyTemplate(template)) {
		return prettyList(filter, tooltip, template, style, classes);
	}
	if (classes !== undefined) {
		classes = classes.split('.').join(' ');
	}
	return utils.makeWidget(parser, '$list', {
		filter: filter,
		tooltip: tooltip,
		template: template,
		style: style || undefined,
		itemClass: classes});
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
