/*\

This specifies logic for updating filters to reflect title changes.

\*/

var refHandler = require("$:/plugins/flibbles/relink/js/fieldtypes/reference");
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");
var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var filterRelinkers = utils.getModulesByTypeAsHashmap('relinkfilter', 'name');

exports.name = "filter";

exports.report = function(filter, callback, options) {
	if (filter) {
		try {
			var parseTree = options.wiki.parseFilter(filter);
		} catch (e) {
			// It must have been malformed. Return without doing anything.
			return;
		}
		for (var module in filterRelinkers) {
			filterRelinkers[module].report(parseTree, callback, options);
		}
	}
};

/**Returns undefined if no change was made.
 */
exports.relink = function(filter, fromTitle, toTitle, options) {
	var changed = false;
	var results = {};
	var parseTree;
	if (filter) {
		try {
			parseTree = options.wiki.parseFilter(filter);
		} catch (e) {
			// It must have been malformed. Return without doing anything.
			return;
		}
		for (var module in filterRelinkers) {
			var entry = filterRelinkers[module].relink(parseTree, fromTitle, toTitle, options);
			if (entry) {
				if (entry.changed) {
					changed = true;
				}
				if (entry.impossible) {
					results.impossible = true;
				}
			}
		}
	}
	if (changed) {
		var builder = assembleFilterString(parseTree, filter, options);
		results.output = builder.results();
		results.impossible = results.impossible || builder.impossible;
		return results;
	}
	if (results.impossible) {
		return results;
	}
	return undefined
};

function assembleFilterString(parseTree, oldFilter, options) {
	var relinker = new Rebuilder(oldFilter),
		wordBarrierRequired = false,
		p = 0;
	for (var i = 0; i < parseTree.length; i++) {
		var start = $tw.utils.skipWhiteSpace(oldFilter, p);
		if (start !== p) {
			// There's some breathing room between this run and the last.
			// We'll never need to insert space.
			wordBarrierRequired = false;
			p = start;
		}
		var run = parseTree[i];
		if (run.prefix) {
			if (wordBarrierRequired) {
				relinker.add(' ', p, p);
				wordBarrierRequired = false;
			}
			p += run.prefix.length;
		}
		if (oldFilter[p] !== '['
		|| (oldFilter[p+1] === '[' && run.operators.length === 1)) {
			// It's a string title
			var text = run.operators[0].operands[0].text,
				end,
				old;
			switch (oldFilter[p]) {
			case "'":
			case '"':
				// p + 1 to skip the first quote
				// indexOf() + 1 to skip the last
				end = oldFilter.indexOf(oldFilter[p], p+1) + 1;
				old = oldFilter.substring(p+1, end-1);
				break;
			case '[':
				end = oldFilter.indexOf(']', p);
				old = oldFilter.substring(p+2, end);
				// +2 to get past the ']]'
				end += 2;
				break;
			default:
				end = skipWord(oldFilter, p);
				old = oldFilter.substring(p, end);
			}
			if (old !== text) {
				var wrapped = wrapTitle(text, oldFilter[p] !== "[" ? oldFilter[p] : '', options);
				if (wrapped !== undefined) {
					// This is a no-quote title. If breathing room is required,
					// add it. Also, we may need breathing room after it.
					if (wordBarrierRequired && wrapped[0] !== "[") {
						relinker.add(' ', p, p);
					}
					relinker.add(wrapped, p, end);
					wordBarrierRequired = wrapped === text;
				} else {
					relinker.impossible = true;
				}
			} else {
				if (wordBarrierRequired && oldFilter[p] !== "[") {
					relinker.add(' ', p, p);
				}
				wordBarrierRequired = oldFilter.indexOf(text) === p;
			}
			p = end;
		} else {
			wordBarrierRequired = false;
			p++;
			for (var j = 0; j < run.operators.length; j++) {
				var operator = run.operators[j];
				var start = p;
				for (var index = 0; index < operator.operands.length; index++) {
					var operand = operator.operands[index],
						skip = false;
						end,
						wrapped;
					if (operand.indirect) {
						p = oldFilter.indexOf('{', p);
						end = oldFilter.indexOf('}', p+1);
						wrapped = '{' + operand.text + '}';
					} else if (operand.variable) {
						p = oldFilter.indexOf('<', p);
						end = oldFilter.indexOf('>', p+1);
						wrapped = '<' + operand.text + '>';
					} else if (operator.regexp) {
						p = oldFilter.indexOf('/', p);
						end = oldFilter.indexOf('/', p+1);
						skip = true;
					} else {
						p = oldFilter.indexOf('[', p);
						end = oldFilter.indexOf(']', p+1);
						if (!canBePrettyOperand(operand.text) || (options.inBraces && operand.text.indexOf('}}}') >= 0)) {
							skip = true;
							relinker.impossible = true;
						} else {
							wrapped = '[' + operand.text + ']';
						}
					}
					end++; // skip the closing brace
					if (index === 0) {
						// If this is the first operand, let's first recreate the operator signature in case it was changed at all.
						relinker.add(operatorSignature(operator, oldFilter, start), start, p);
					}
					if (!skip) {
						relinker.add(wrapped, p, end);
					}
					p = end;
				}
			}
			p++; // Skip the closing brace;
		}
	}
	return relinker;
};

function operatorSignature(operator, oldText, start) {
	// If it's a title operand, try to determine if it was a shorthand.
	var prefix = operator.prefix || '';
	var signature = prefix + ((operator.operator === 'title' && oldText[start + prefix.length] !== 't')? '': operator.operator);
	if (operator.suffix) {
		signature += ':' + operator.suffix;
	}
	return signature;
}

function skipWord(source,pos) {
	var c;
	while(true) {
		c = source.charAt(pos);
		if((c !== "") && (c !== " ") && (c !== "\f") && (c !== "\n")
		&& (c !== "\r") && (c !== "\t")
		&& (c !== "\v")&& (c !== "\u00a0") // Ignores obscure unicode spaces
		&& (c !== "[") && (c !== "]")) { // Ignore brackets
			pos++;
		} else {
			return pos;
		}
	}
};

/* Same as this.relink, except this has the added constraint that the return
 * value must be able to be wrapped in curly braces. (i.e. '{{{...}}}')
 */
exports.relinkInBraces = function(filter, fromTitle, toTitle, options) {
	var braceOptions = $tw.utils.extend({inBraces: true}, options);
	var entry = this.relink(filter, fromTitle, toTitle, braceOptions);
	if (entry && entry.output && !canBeInBraces(entry.output)) {
		// It was possible, but it won't fit in braces, so we must give up
		delete entry.output;
		entry.impossible = true;
	}
	return entry;
};

function wrapTitle(value, preference, options) {
	var choices = {
		"": function(v) {return /^[^\s\[\]\}\+\-\~\=\:][^\s\[\]]*[^\s\[\]\}]$/.test(v); },
		"[": canBePrettyOperand,
		"'": function(v) {return v.indexOf("'") < 0; },
		'"': function(v) {return v.indexOf('"') < 0; }
	};
	var wrappers = {
		"": function(v) {return v; },
		"[": function(v) {return "[["+v+"]]"; },
		"'": function(v) {return "'"+v+"'"; },
		'"': function(v) {return '"'+v+'"'; }
	};
	if (options.inBraces && value.indexOf('}}}') >= 0) {
		// In this particular case, it can't be wrapped in this filter,
		// even if it would have worked within the context of the filter itself
		return undefined;
	}
	if (!choices[preference]) {
		preference = '';
	}
	if (choices[preference](value)) {
		return wrappers[preference](value);
	}
	for (var quote in choices) {
		if (choices[quote](value)) {
			return wrappers[quote](value);
		}
	}
	// No quotes will work on this
	return undefined;
}

function canBePrettyOperand(value) {
	return value.indexOf(']') < 0;
};

function canBeInBraces(value) {
	return value.indexOf("}}}") < 0 && value.substr(value.length-2) !== '}}';
};
