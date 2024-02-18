exports.name = 'substitution';
var subHandler = require("$:/plugins/flibbles/relink/js/utils/substitution.js");

exports.report = function(definition, callback, options) {
	if (definition.type === 'define') {
		var options = Object.create(options);
		options.noFilterSubstitution = true;
		subHandler.report(definition.body, function(title, blurb, style) {
			callback(title, '\\define ' + definition.name + '() ' + (blurb || ''), style);
		}, options);
	}
};

exports.relink = function(definition, fromTitle, toTitle, options) {
	var results;
	if (definition.type === "define") {
		var options = Object.create(options);
		options.noFilterSubstitution = true;
		results = subHandler.relink(definition.body, fromTitle, toTitle, options);
		if (results && results.output) {
			definition.body = results.output;
		}
	}
	return results;
};
