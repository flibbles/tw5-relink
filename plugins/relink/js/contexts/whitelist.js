/*\

This top-level context manages settings inside the whitelist. It never has
a parent.

\*/

var utils = require('../utils');
var Context = require('./context').context;

var prefix = "$:/config/flibbles/relink/";

/**Factories define methods that create settings given config tiddlers.
 * for factory method 'example', it will be called once for each:
 * "$:/config/flibbles/relink/example/..." tiddler that exists.
 * the argument "key" will be set to the contents of "..."
 *
 * The reason I build relink settings in this convoluted way is to minimize
 * the number of times tiddlywiki has to run through EVERY tiddler looking
 * for relink config tiddlers.
 */
var settingsGenerators = utils.getModulesByTypeAsHashmap('relinksetting', 'name');

function WhitelistContext(wiki) {
	build(this, wiki);
};

exports.whitelist = WhitelistContext;

WhitelistContext.prototype = new Context();

/**Hot directories are directories for which if anything changes inside them,
 * then Relink must completely rebuild its index.
 * By default, this includes the whitelist settings, but relink-titles also
 * includes its rules disabling directory.
 * This is the FIRST solution I came up with to this problem. If you're
 * looking at this, please make a github issue so I have a chance to understand
 * your needs. This is currently a HACK solution.
 */
WhitelistContext.hotDirectories = [prefix];

WhitelistContext.prototype.getAttribute = function(elementName) {
	return this.attributes[elementName];
};

WhitelistContext.prototype.getAttributes = function() {
	return flatten(this.attributes);
};

WhitelistContext.prototype.getFields = function() {
	return this.fields;
};

WhitelistContext.prototype.getConfig = function(category) {
	return this[category];
};

WhitelistContext.prototype.getOperator = function(operatorName, operandIndex) {
	var op = this.operators[operatorName];
	return op && op[operandIndex || 1];
};

WhitelistContext.prototype.getOperators = function() {
	var signatures = Object.create(null);
	for (var op in this.operators) {
		var operandSet = this.operators[op];
		for (var index in operandSet) {
			var entry = operandSet[index];
			signatures[entry.key] = entry;
		}
	}
	return signatures;
};

WhitelistContext.prototype.getMacro = function(macroName) {
	return this.macros[macroName];
};

WhitelistContext.prototype.getMacros = function() {
	return flatten(this.macros);
};

WhitelistContext.prototype.getException = function(tiddlerTitle) {
	return this.exceptions[tiddlerTitle];
};

WhitelistContext.prototype.changed = function(changedTiddlers) {
	for (var i = 0; i < WhitelistContext.hotDirectories.length; i++) {
		var dir = WhitelistContext.hotDirectories[i];
		for (var title in changedTiddlers) {
			if (title.substr(0, dir.length) === dir) {
				return true;
			}
		}
	}
	return false;
};

WhitelistContext.prototype.hasImports = function(value) {
	// We don't care if imports are used. This is the global level.
	return false;
};

function build(settings, wiki) {
	for (var name in settingsGenerators) {
		settings[name] = Object.create(null);
	}
	wiki.eachShadowPlusTiddlers(function(tiddler, title) {
		if (title.substr(0, prefix.length) === prefix) {
			var remainder = title.substr(prefix.length);
			var category = root(remainder);
			var factory = settingsGenerators[category];
			if (factory) {
				var name = remainder.substr(category.length+1);
				factory.generate(settings[category], tiddler, name, wiki);
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
