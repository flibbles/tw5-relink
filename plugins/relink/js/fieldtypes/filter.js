/*\
This specifies logic for updating filters to reflect title changes.
\*/

/**Returns undefined if no change was made.
 */

var CannotRelinkError = require("$:/plugins/flibbles/relink/js/CannotRelinkError.js");
var settings = require('$:/plugins/flibbles/relink/js/settings.js');

function FilterRelinker(text) {
	this.text = text;
	this.pos = 0;
	this.builder = [];
};

FilterRelinker.prototype.add = function(index, value) {
	this.builder.push(this.text.substring(this.pos, index));
	this.builder.push(value);
};

FilterRelinker.prototype.results = function() {
	if (this.builder.length > 0) {
		this.builder.push(this.text.substr(this.pos));
		return this.builder.join('');
	}
	return undefined;
};

exports.filter = function(filter, fromTitle, toTitle, options) {
	var indices;
	if (filter && filter.indexOf(fromTitle) >= 0) {
		var relinker = new FilterRelinker(filter);
		try {
			var indices = scanFilter(filter,relinker,fromTitle,toTitle,options);
		} catch (err) {
			if (err instanceof CannotRelinkError) {
				throw err;
			}
			// Not really anything to do. It's a bad filter.
			// Move on.
		}
		var results = relinker.results();
		return results;
	}
	return undefined;
};

// Returns an array of indices to replace
function scanFilter(filterString, relinker, fromTitle, toTitle, options) {
	var whitelist = settings.getOperators(options);
	var p = 0, // Current position in the filter string
		match, noPrecedingWordBarrier,
		wordBarrierRequired=false;
	var whitespaceRegExp = /\s+/mg,
		operandRegExp = /((?:\+|\-|~|=)?)(?:(\[)|(?:"([^"]*)")|(?:'([^']*)')|([^\s\[\]]+))/mg;
	while(p < filterString.length) {
		// Skip any whitespace
		whitespaceRegExp.lastIndex = p;
		match = whitespaceRegExp.exec(filterString);
		noPrecedingWordBarrier = false;
		if(match && match.index === p) {
			p = p + match[0].length;
		} else if (p != 0) {
			if (wordBarrierRequired) {
				relinker.add(p, ' ');
				relinker.pos = p;
				wordBarrierRequired = false;
			} else {
				noPrecedingWordBarrier = true;
			}
		}
		// Match the start of the operation
		if(p < filterString.length) {
			operandRegExp.lastIndex = p;
			match = operandRegExp.exec(filterString);
			if(!match || match.index !== p) {
				throw "Bad Filter";
			}
			if(match[1]) { // prefix
				p++;
			}
			if(match[2]) { // Opening square bracket
				var standaloneTitle = /\[\[([^\]]+)\]\]/g;
				standaloneTitle.lastIndex = p;
				var alone = standaloneTitle.exec(filterString);
				if (!alone || alone.index != p) {
					p =parseFilterOperation(relinker,fromTitle,toTitle,filterString,p,whitelist,options);
					continue;
				} else {
					match[6] = alone[1];
					operandRegExp.lastIndex = standaloneTitle.lastIndex;
				}
			}
			if(match[3] || match[4] || match[5] || match[6]) { // Double quoted string, single quoted string, or noquote
				var preference = undefined;
				if (match[3]) {
					preference = '"';
				} else if (match[4]) {
					preference = "'";
				} else if (match[5]) {
					preference = '';
				}
				var val = match[3] || match[4] || match[5] || match[6];
				if (val === fromTitle) {
					var newVal = wrapTitle(toTitle, preference);
					if (newVal === undefined) {
						if (!options.placeholder) {
							throw new CannotRelinkError();
						}
						newVal = "[<"+options.placeholder.getPlaceholderFor(toTitle)+">]";
						options.usedPlaceholder = true;
					}
					if (newVal[0] != '[') {
						// not bracket enclosed
						// this requires whitespace
						// arnound it
						if (noPrecedingWordBarrier && !match[1]) {
							relinker.add(p, ' ');
							relinker.pos = p;
						}
						wordBarrierRequired = true;
					}
					relinker.add(p, newVal);
					relinker.pos = operandRegExp.lastIndex;
				}
				p = operandRegExp.lastIndex;
			}
		}
	}
};

function wrapTitle(value, preference) {
	var choices = {
		"": function(v) {return !/[\s\[\]]/.test(v); },
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
	if (choices[preference]) {
		if (choices[preference](value)) {
			return wrappers[preference](value);
		}
	}
	for (var quote in choices) {
		if (choices[quote](value)) {
			return wrappers[quote](value);
		}
	}
	// No quotes will work on this
	return undefined;
}

function parseFilterOperation(relinker, fromTitle, toTitle, filterString, p, whitelist, options) {
	var nextBracketPos, operator;
	// Skip the starting square bracket
	if(filterString.charAt(p++) !== "[") {
		throw "Missing [ in filter expression";
	}
	// Process each operator in turn
	do {
		operator = {};
		// Check for an operator prefix
		if(filterString.charAt(p) === "!") {
			p++;
		}
		// Get the operator name
		nextBracketPos = filterString.substring(p).search(/[\[\{<\/]/);
		if(nextBracketPos === -1) {
			throw "Missing [ in filter expression";
		}
		nextBracketPos += p;
		var bracket = filterString.charAt(nextBracketPos);
		operator.operator = filterString.substring(p,nextBracketPos);

		// Any suffix?
		var colon = operator.operator.indexOf(':');
		if(colon > -1) {
			operator.suffix = operator.operator.substring(colon + 1);
			operator.operator = operator.operator.substring(0,colon) || "field";
		}
		// Empty operator means: title
		else if(operator.operator === "") {
			operator.operator = "title";
		}

		p = nextBracketPos + 1;
		switch (bracket) {
			case "{": // Curly brackets
				nextBracketPos = filterString.indexOf("}",p);
				var operand = filterString.substring(p,nextBracketPos);
				var ref = $tw.utils.parseTextReference(operand);
				if (ref.title === fromTitle) {
					if(!canBePrettyIndirect(toTitle)) {
						throw new CannotRelinkError();
					}
					ref.title = toTitle;
					var newRef = referenceToString(ref);
					// We don't check the whitelist.
					// All indirect operands convert.
					relinker.add(p, newRef);
					relinker.pos = nextBracketPos;
				}
				break;
			case "[": // Square brackets
				nextBracketPos = filterString.indexOf("]",p);
				var operand = filterString.substring(p,nextBracketPos);
				// Check if this is a relevant operator
				if (operand === fromTitle) {
					var wrapped;
					if (!canBePrettyOperand(toTitle)) {
						if (!options.placeholder) {
							throw new CannotRelinkError();
						}
						var ph = options.placeholder.getPlaceholderFor(toTitle);
						wrapped = "<"+ph+">";
						options.usedPlaceholder = true;
					} else {
						wrapped = "["+toTitle+"]";
					}
					if (whitelist[operator.operator]
					|| (operator.suffix && whitelist[operator.operator + ":" + operator.suffix])) {
						relinker.add(p-1, wrapped);
						relinker.pos = nextBracketPos+1;
					}
				}
				break;
			case "<": // Angle brackets
				nextBracketPos = filterString.indexOf(">",p);
				break;
			case "/": // regexp brackets
				var rex = /^((?:[^\\\/]*|\\.)*)\/(?:\(([mygi]+)\))?/g,
					rexMatch = rex.exec(filterString.substring(p));
				if(rexMatch) {
					nextBracketPos = p + rex.lastIndex - 1;
				}
				else {
					throw "Unterminated regular expression in filter expression";
				}
				break;
		}

		if(nextBracketPos === -1) {
			throw "Missing closing bracket in filter expression";
		}
		p = nextBracketPos + 1;

	} while(filterString.charAt(p) !== "]");
	// Skip the ending square bracket
	if(filterString.charAt(p++) !== "]") {
		throw "Missing ] in filter expression";
	}
	// Return the parsing position
	return p;
}

function canBePrettyOperand(value) {
	return value.indexOf(']') < 0;
};

function canBePrettyIndirect(value) {
	return value.indexOf('}') < 0;
};

// TODO: This exact function occurs in a couple places. Centralize it.
function referenceToString(textReference) {
	var title = textReference.title || '';
	if (textReference.field) {
		return title + "!!" + textReference.field;
	} else if (textReference.index) {
		return title + "##" + textReference.index;
	}
	return title;
};
