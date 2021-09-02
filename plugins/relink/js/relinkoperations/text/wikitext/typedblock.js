/*\
module-type: relinkwikitextrule

Handles the typeed blocks, as in:

$$$text/vnd.tiddlywiki>text/html
...
$$$

\*/

var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");
var language = require('$:/plugins/flibbles/relink/js/language.js');

exports.name = "typedblock";

exports.types = {block: true};

var textOperators;
var oldTextOperators;

function getTextOperator(type, options) {
	var operator;
	if (textOperators === undefined) {
		textOperators = utils.getModulesByTypeAsHashmap('relinktext', 'type');
		oldTextOperators = utils.getModulesByTypeAsHashmap('relinktextoperator', 'type');
	}
	operator = textOperators[type];
	if (operator) {
		return operator;
	}
	var info = $tw.utils.getFileExtensionInfo(type);
	if (info && textOperators[info.type]) {
		return textOperators[info.type];
	}
	var old = oldTextOperators[type] || (info && oldTextOperators[info.type]);
	if (old) {
		var vars = Object.create(options);
		vars.variables = {type: old.type, keyword: type};
		var warnString = language.getString("text/html", "Warning/OldRelinkTextOperator", vars)
		language.warn(warnString);
		oldTextOperators[type] = undefined;
	}
};

function getText() {
	var reEnd = /\r?\n\$\$\$\r?(?:\n|$)/mg;
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Look for the end of the block
	reEnd.lastIndex = this.parser.pos;
	var match = reEnd.exec(this.parser.source),
		text;
	// Process the block
	if(match) {
		text = this.parser.source.substring(this.parser.pos,match.index);
		this.parser.pos = match.index + match[0].length;
	} else {
		text = this.parser.source.substr(this.parser.pos);
		this.parser.pos = this.parser.sourceLength;
	}
	return text;
};

exports.report = function(text, callback, options) {
	var innerText = getText.call(this),
		operator = getTextOperator(this.match[1], options);
	if (operator) {
		return operator.report(innerText, callback, options);
	}
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var start = this.parser.pos,
		innerStart = this.matchRegExp.lastIndex,
		innerText = getText.call(this),
		operator = getTextOperator(this.match[1], options);
	if (operator) {
		var innerOptions = Object.create(options);
		innerOptions.settings = this.parser.context;
		var results = operator.relink(innerText, fromTitle, toTitle, innerOptions);
		if (results && results.output) {
			var builder = new Rebuilder(text, start);
			builder.add(results.output, innerStart, innerStart + innerText.length);
			results.output = builder.results(this.parser.pos);
		}
		return results;
	}
};
