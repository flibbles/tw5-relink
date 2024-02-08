/*\
module-type: wikirule

This defines the \relink inline pragma used to locally declare
relink rules for macros.

It takes care of providing its own relink and report rules.

\*/

var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var language = require('$:/plugins/flibbles/relink/js/language.js');
var pragmaOperators = utils.getModulesByTypeAsHashmap('relinkpragma', 'name');

exports.name = "relink";
exports.types = {pragma: true};

exports.init = function(parser) {
	this.parser = parser;
	this.matchRegExp = /^\\relink[^\S\r\n]+([^(\s]+)([^\r\n]*)(\r?\n)?/mg;
};

/**This makes the widget that the macro library will later parse to determine
 * new macro relink state.
 *
 * It's a <$set> widget so it can appear BEFORE \define pragma and not
 * prevent that pragma from being scooped up by importvariables.
 * (importvariables stops scooping as soon as it sees something besides $set) */
exports.parse = function() {
	this.parser.pos = this.matchRegExp.lastIndex;
	var macroName;
	var macroParams = Object.create(null);
	var error = undefined;
	var rtn = [];
	var self = this;
	interpretSettings(this, function(macro, parameter, type) {
		macroName = macro;
		if (type && !utils.getType(type)) {
			error = language.getString("text/plain", "Error/UnrecognizedType",
				{variables: {type: type}, wiki: self.parser.wiki});
		}
		macroParams[parameter] = type;
	});
	// If no macroname. Return nothing, this rule will be ignored by parsers
	if (macroName) {
		var relink = Object.create(null);
		relink[macroName] = macroParams;
		rtn.push({
			type: "set",
			attributes: {
				name: {type: "string", value: ""}
			},
			children: [],
			isRelinkDefinition: true,
			isMacroDefinition: true,
			relink: relink});
	}
	if (error) {
		rtn.push({
			type: "element", tag: "span", attributes: {
				"class": {
					type: "string",
					value: "tc-error tc-relink-error"
				}
			}, children: [
				{type: "text", text: error}
			]});
	}
	return rtn;
};

exports.report = function(text, callback, options) {
	operate(this, options);
	for (var operator in pragmaOperators) {
		pragmaOperators[operator].report(this, callback, options);
	}
};

exports.relink = function(text, fromTitle, toTitle, options) {
	operate(this, options);
	var entry;
	for (var operator in pragmaOperators) {
		// Yes, this only handles one thing for now. I haven't bothered
		// breaking up \relink into a modifiable type.
		entry = pragmaOperators[operator].relink(this, fromTitle, toTitle, options);
	}
	return entry;
};

function operate(rule, options) {
	var parser = rule.parser;
	var currentTiddler = parser.context.widget.variables.currentTiddler.value;
	parser.pos = rule.matchRegExp.lastIndex;
	interpretSettings(rule, function(macro, parameter, type) {
		options.settings.addSetting(parser.wiki, macro, parameter, type, currentTiddler);
	});
	// Return nothing, because this rule is ignored by the parser
	return undefined;
};

function interpretSettings(rule, block) {
	var paramString = rule.match[2];
	if (paramString !== "") {
		var macro = rule.match[1];
		var reParam = /\s*([$A-Za-z0-9\-_]+)(?:\s*:\s*([^\s]+))?/mg;
		var paramMatch = reParam.exec(paramString);
		while (paramMatch) {
			var parameter = paramMatch[1];
			var type = paramMatch[2];
			block(macro, parameter, type);
			paramMatch = reParam.exec(paramString);
		}
	}
};
