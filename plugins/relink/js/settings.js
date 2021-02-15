/*\
module-type: library

This handles the fetching and distribution of relink settings.

\*/

var utils = require('./utils');
var surveyors = [];
var prefix = "$:/config/flibbles/relink/";

$tw.modules.forEachModuleOfType("relinksurveyor", function(title, exports) {
	if (exports.survey) {
		surveyors.push(exports);
	}
});

function Settings(wiki) {
	this.wiki = wiki;
	this.rebuild();
};

///// Legacy. You used to be able to access the type from utils.
Settings.getType = utils.getType;
/////

module.exports = Settings;

Settings.prototype.survey = function(text, fromTitle, options) {
	if (text) {
		for (var i = 0; i < surveyors.length; i++) {
			if (surveyors[i].survey(text, fromTitle, options)) {
				return true;
			}
		}
	}
	return false;
};

Settings.prototype.getAttribute = function(elementName) {
	return this.attributes[elementName];
};

Settings.prototype.getAttributes = function() {
	return flatten(this.attributes);
};


Settings.prototype.getFields = function() {
	return this.fields;
};

Settings.prototype.getOperators = function() {
	return this.operators;
};

Settings.prototype.getMacro = function(macroName) {
	return this.macros[macroName];
};

Settings.prototype.getMacros = function() {
	return flatten(this.macros);
};

Settings.prototype.refresh = function(changedTiddlers) {
	for (var title in changedTiddlers) {
		if (title.substr(0, prefix.length) === prefix) {
			this.rebuild();
			return true;
		}
	}
	return false;
};

/**Factories define methods that create settings given config tiddlers.
 * for factory method 'example', it will be called once for each:
 * "$:/config/flibbles/relink/example/..." tiddler that exists.
 * the argument "key" will be set to the contents of "..."
 *
 * The reason I build relink settings in this convoluted way is to minimize
 * the number of times tiddlywiki has to run through EVERY tiddler looking
 * for relink config tiddlers.
 *
 * Also, by exporting "factories", anyone who extends relink can patch in
 * their own factory methods to create settings that are generated exactly
 * once per rename.
 */
var factories = {
	attributes: function(attributes, data, key) {
		var elem = root(key);
		var attr = key.substr(elem.length+1);
		attributes[elem] = attributes[elem] || Object.create(null);
		attributes[elem][attr] = data;
	},
	fields: function(fields, data, name) {
		fields[name] = data;
	},
	macros: function(macros, data, key) {
		// We take the last index, not the first, because macro
		// parameters can't have slashes, but macroNames can.
		var name = dir(key);
		var arg = key.substr(name.length+1);
		macros[name] = macros[name] || Object.create(null);
		macros[name][arg] = data;
	},
	operators: function(operators, data, name) {
		operators[name] = data;
	}
};

Settings.prototype.rebuild = function() {
	var self = this;
	for (var name in factories) {
		this[name] = Object.create(null);
	}
	this.wiki.eachShadowPlusTiddlers(function(tiddler, title) {
		if (title.substr(0, prefix.length) === prefix) {
			var remainder = title.substr(prefix.length);
			var category = root(remainder);
			var factory = factories[category];
			if (factory) {
				var name = remainder.substr(category.length+1);
				//TODO: This doesn't handle newline characters
				var data = utils.getType(tiddler.fields.text);
				if (data) {
					data.source = title;
					// Secret feature. You can access a config tiddler's
					// fields from inside the fieldtype handler. Cool
					// tricks can be done with this.
					data.fields = tiddler.fields;
					factory(self[category], data, name);
				}
			}
		}
	});
};

/* Returns first bit of a path. path/to/tiddler -> path
 */
function root(string) {
	var index = string.indexOf('/');
	if (index >= 0) {
		return string.substr(0, index);
	}
};

/* Returns all but the last bit of a path. path/to/tiddler -> path/to
 */
function dir(string) {
	var index = string.lastIndexOf('/');
	if (index >= 0) {
		return string.substr(0, index);
	}
}

/* Turns {dir: {file1: 'value1', file2: 'value2'}}
 * into {dir/file1: 'value1', dir/file2: 'value2'}
 */
function flatten(set) {
	var signatures = Object.create(null);
	for (var outerName in set) {
		var setItem = set[outerName];
		for (var innerName in setItem) {
			signatures[outerName + "/" + innerName] = setItem[innerName];
		}
	}
	return signatures;
};
