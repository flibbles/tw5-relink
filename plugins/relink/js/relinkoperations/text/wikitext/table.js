/*\
module-type: relinkwikitextrule

Handles tables. Or rather handles the cells inside the tables, since tables
themselves aren't relinked.

\*/

var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");

exports.name = "table";

exports.types = {block: true};

exports.report = function(text, callback, options) {
	var rowRegExp = /^\|([^\n]*)\|([fhck]?)\r?(?:\n|$)/mg,
		rowTermRegExp = /(\|(?:[fhck]?)\r?(?:\n|$))/mg;
	// Match the row
	rowRegExp.lastIndex = this.parser.pos;
	var rowMatch = rowRegExp.exec(this.parser.source);
	while(rowMatch && rowMatch.index === this.parser.pos) {
		var rowType = rowMatch[2];
		// Check if it is a class assignment
		if(rowType === "k") {
			this.parser.pos = rowMatch.index + rowMatch[0].length;
		} else if(rowType === "c") {
			// Is this a caption row?
			// If so, move past the opening `|` of the row
			this.parser.pos++;
			// Parse the caption
			var oldCallback = this.parser.callback;
			this.parser.callback = function(title, blurb) {
				callback(title, '|' + blurb + '|c');
			};
			try {
				this.parser.parseInlineRun(rowTermRegExp,{eatTerminator: true});
			} finally {
				this.parser.callback = oldCallback;
			}
		} else {
			// Process the row
			processRow.call(this, rowType, callback);
			this.parser.pos = rowMatch.index + rowMatch[0].length;
		}
		rowMatch = rowRegExp.exec(this.parser.source);
	}
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var rowRegExp = /^\|([^\n]*)\|([fhck]?)\r?(?:\n|$)/mg,
		rowTermRegExp = /(\|(?:[fhck]?)\r?(?:\n|$))/mg,
		builder = new Rebuilder(text, this.parser.pos),
		impossible = false,
		output,
		entry;
	// Match the row
	rowRegExp.lastIndex = this.parser.pos;
	var rowMatch = rowRegExp.exec(this.parser.source);
	while(rowMatch && rowMatch.index === this.parser.pos) {
		var rowType = rowMatch[2];
		// Check if it is a class assignment
		if(rowType === "k") {
			this.parser.pos = rowMatch.index + rowMatch[0].length;
		} else {
			// Is this a caption row?
			if(rowType === "c") {
				// If so, move past the opening `|` of the row
				this.parser.pos++;
				// Parse the caption
				output = this.parser.parseInlineRun(rowTermRegExp,{eatTerminator: true});
			} else {
				// Process the row
				output = processRow.call(this);
				this.parser.pos = rowMatch.index + rowMatch[0].length;
			}
			if (output.length > 0) {
				for (var i = 0; i < output.length; i++) {
					var o = output[i];
					if (o.output) {
						builder.add(o.output, o.start, o.end);
					}
					if (o.impossible) {
						impossible = true;
					}
				}
			}
		}
		rowMatch = rowRegExp.exec(this.parser.source);
	}
	if (builder.changed() || impossible) {
		entry = {}
		entry.output = builder.results(this.parser.pos);
		if (impossible) {
			entry.impossible = true;
		}
	}
	return entry;
};

var processRow = function(rowType, callback) {
	var cellRegExp = /(?:\|([^\n\|]*)\|)|(\|[fhck]?\r?(?:\n|$))/mg,
		cellTermRegExp = /((?:\x20*)\|)/mg,
		children = [];
	// Match a single cell
	cellRegExp.lastIndex = this.parser.pos;
	var cellMatch = cellRegExp.exec(this.parser.source);
	while(cellMatch && cellMatch.index === this.parser.pos) {
		if(cellMatch[2]) {
			// End of row
			this.parser.pos = cellRegExp.lastIndex - 1;
			break;
		}
		switch (cellMatch[1]) {
		case '~':
		case '>':
		case '<':
			// Move to just before the `|` terminating the cell
			this.parser.pos = cellRegExp.lastIndex - 1;
			break;
		default:
			// For ordinary cells, step beyond the opening `|`
			this.parser.pos++;
			// Look for a space at the start of the cell
			var spaceLeft = false;
			var prefix = '|';
			var suffix = '|';
			if(this.parser.source.substr(this.parser.pos).search(/^\^([^\^]|\^\^)/) === 0) {
				prefix += '^';
				this.parser.pos++;
			} else if(this.parser.source.substr(this.parser.pos).search(/^,([^,]|,,)/) === 0) {
				prefix += ',';
				this.parser.pos++;
			}
			var chr = this.parser.source.substr(this.parser.pos,1);
			while(chr === " ") {
				spaceLeft = true;
				this.parser.pos++;
				chr = this.parser.source.substr(this.parser.pos,1);
			}
			if (spaceLeft) {
				prefix += ' ';
			}
			// Check whether this is a heading cell
			if(chr === "!") {
				this.parser.pos++;
				prefix += '!';
			}
			// Parse the cell
			var oldCallback = this.parser.callback;
			var reports = [];
			this.parser.callback = function(title, blurb) {
				reports.push(title, blurb);
			};
			try {
				var output = this.parser.parseInlineRun(cellTermRegExp,{eatTerminator: true});
				if (output.length > 0) {
					children.push(output[0]);
				}
				if(this.parser.source.substr(this.parser.pos - 2,1) === " ") { // spaceRight
					suffix = ' |';
				}
				for (var i = 0; i < reports.length; i += 2) {
					callback(reports[i], prefix + reports[i+1] + suffix + rowType);
				}
			} finally {
				this.parser.callback = oldCallback;
			}
			// Move back to the closing `|`
			this.parser.pos--;
		}
		cellRegExp.lastIndex = this.parser.pos;
		cellMatch = cellRegExp.exec(this.parser.source);
	}
	return children;
};
