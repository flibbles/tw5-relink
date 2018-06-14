/*\
title: $:/plugins/flibbles/relink/js/utils.js
type: application/javascript
module-type: library

Contains methods for relinking fields which are used by the different module
parts.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

exports.relinkStringList = function(tiddler, field, fromTitle, toTitle, changes) {
	var list = $tw.utils.parseStringArray(tiddler.fields[field] || ""),
		isModified = false;
	$tw.utils.each(list,function (title,index) {
		if(title === fromTitle) {
console.log(`Renaming ${field} item '${list[index]}' to '${toTitle}' of tiddler '${tiddler.fields.title}'`);
			list[index] = toTitle;
			isModified = true;
		}
	});
	if (isModified) {
		changes[field] = $tw.utils.stringifyList(list);
	}
};

exports.relinkList = function(tiddler, field, fromTitle, toTitle, changes) {
	var list = (tiddler.fields[field] || []).slice(0),
		isModified = false,
		descriptor = (field === "tags")? "tag": (field + " item");
	$tw.utils.each(list,function (title,index) {
		if(title === fromTitle) {
console.log(`Renaming ${descriptor} '${list[index]}' to '${toTitle}' of tiddler '${tiddler.fields.title}'`);
			list[index] = toTitle;
			isModified = true;
		}
	});
	if (isModified) {
		changes[field] = list;
	}
};

exports.relinkField = function(tiddler, field, fromTitle, toTitle, changes) {
	var fieldValue = (tiddler.fields[field] || "");
	if (fieldValue === fromTitle) {
console.log(`Renaming ${field} field '${fieldValue}' to '${toTitle}' of tiddler '${tiddler.fields.title}'`);
		changes[field] = toTitle;
	}
};

exports.relinkFilter = function(tiddler, field, fromTitle, toTitle, changes) {
	var filter = tiddler.fields[field],
		indices;
	if (filter && filter.indexOf(fromTitle) >= 0) {
		try {
			var indices = scanFilter(filter,fromTitle,toTitle);
		} catch (err) {
			// Not really anything to do. It's a bad filter.
			// Move on.
		}
		if (indices && indices.length > 0) {
			for (var i = indices.length-1; i>=0; i--) {
				var index = indices[i];
				var to = toTitle;
				var fromLength = fromTitle.length;
				var fromSpace = fromTitle.indexOf(' ') >= 0;
				var toSpace = toTitle.indexOf(' ') >= 0;
				if (toSpace && !fromSpace) {
					var prev = filter[index-1];
					if (prev!=='[' && prev !== "'" && prev !== '"') {
						to = `[[${to}]]`;
					}
				}
				if (fromSpace && !toSpace) {
					if (index >=2
					&& filter.substr(index-2, fromTitle.length+4) === `[[${fromTitle}]]`
					&& (index == 2 || filter[index-3]===' ')
					&& (filter[index+fromLength+2]===' ' || index+fromLength+2 >= filter.length)) {
						index -= 2;
						fromLength += 4;
					}
				}
				filter = filter.slice(0, index) + to + filter.slice(index + fromLength);
				console.log(`Renaming ${field} operand '${fromTitle}' to '${toTitle}'`);
			}
			changes[field] = filter;
		}
	}
};

// Returns an array of indices to replace
function scanFilter(filterString, title) {
	var results = [], // Array of indexes on where to splice
		p = 0, // Current position in the filter string
		match;
	var whitespaceRegExp = /(\s+)/mg,
		operandRegExp = /((?:\+|\-)?)(?:(\[)|(?:"([^"]*)")|(?:'([^']*)')|([^\s\[\]]+))/mg;
	while(p < filterString.length) {
		// Skip any whitespace
		whitespaceRegExp.lastIndex = p;
		match = whitespaceRegExp.exec(filterString);
		if(match && match.index === p) {
			p = p + match[0].length;
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
				p =parseFilterOperation(results,title,filterString,p);
			} else if(match[3] || match[4] || match[5]) { // Double quoted string, single quoted string, or noquote
				var val = match[3] || match[4] || match[5];
				if (val === title) {
					if (match[5]) {
						results.push(p);
					} else {
						results.push(p+1);
					}
				}
				p = match.index + match[0].length;
			}
		}
	}
	return results;
};

function parseFilterOperation(indexes, title, filterString, p) {
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
			if (operand === title
			&& (operator.operator === "title" || (operator.operator === "field" && operator.suffix === "title"))) {
				indexes.push(p);
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
