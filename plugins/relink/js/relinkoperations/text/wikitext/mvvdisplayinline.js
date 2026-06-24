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
			callback(title, '(((' + blurb + separator + ')))', style);
		}, nestedOptions);
	}
	this.parser.pos = m.end;
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var m = this.nextMatch,
		entry,
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
		entry = macrocallHandler.relink(this.parser.context, macro, text, fromTitle, toTitle, nestedOptions);
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
		entry = filterHandler.relink(m.filter, fromTitle, toTitle, nestedOptions);
		if (entry && entry.output) {
			// By copying over the ending newline of the original
			// text if present, thisrelink method thus works for
			// both the inline and block rule
			entry.output = '(((' + entry.output + separator + ')))';
		}
	}
	return entry;
};
