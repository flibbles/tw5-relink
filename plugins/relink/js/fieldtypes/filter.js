/*\
This specifies logic for updating filters to reflect title changes.
\*/

/**Returns undefined if no change was made.
 */

var settings = require('$:/plugins/flibbles/relink/js/settings.js');

function FilterRelinker(text) {
	this.text = text;
	this.pos = 0;
	this.builder = [];
};

FilterRelinker.prototype.add = function(index, value) {
	this.builder.push(this.text.substring(this.pos, index));
	this.builder.push(value);
	//console.log("ADDING:", value
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
		match;
	var whitespaceRegExp = /\s+/mg,
		operandRegExp = /((?:\+|\-)?)(?:(\[[^\[])|(?:"([^"]*)")|(?:'([^']*)')|([^\s\[\]]+)|(?:\[\[([^\]]+)\]\]))/mg;
	while(p < filterString.length) {
		// Skip any whitespace
		whitespaceRegExp.lastIndex = p;
		match = whitespaceRegExp.exec(filterString);
		if(match && match.index === p) {
			p = p + match[0].length;
		} else if (p != 0) {
			// enforce whitespace between runs
			relinker.add(p, ' ');
			relinker.pos = p;
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
				p =parseFilterOperation(relinker,fromTitle,toTitle,filterString,p,whitelist);
			} else if(match[3] || match[4] || match[5] || match[6]) { // Double quoted string, single quoted string, or noquote
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
					relinker.add(p, wrapTitle(toTitle, preference));
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
		"[": function(v) {return v.indexOf(']') < 0; },
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

function parseFilterOperation(relinker, fromTitle, toTitle, filterString, p, whitelist) {
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
				operator.skip = true;
				nextBracketPos = filterString.indexOf("}",p);
				break;
			case "[": // Square brackets
				nextBracketPos = filterString.indexOf("]",p);
				break;
			case "<": // Angle brackets
				operator.skip = true;
				nextBracketPos = filterString.indexOf(">",p);
				break;
			case "/": // regexp brackets
				operator.skip = true;
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
		if (!operator.skip) {
			var operand = filterString.substring(p,nextBracketPos);
			// Check if this is a relevant operator
			if (operand === fromTitle) {
				if (whitelist[operator.operator]
				|| (whitelist.title && (operator.operator === "field" && operator.suffix === "title"))) {
					relinker.add(p, toTitle);
					relinker.pos = nextBracketPos;
				}
			}
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
