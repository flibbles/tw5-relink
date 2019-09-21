/*\
module-type: library

This handles the fetching and distribution of relink settings.

\*/

var fieldTypes = Object.create(null);

$tw.modules.forEachModuleOfType("relinkfieldtype", function(title, exports) {
	fieldTypes[exports.name] = exports;
	// For legacy reasons, some of the field types can go by other names
	if (exports.aliases) {
		$tw.utils.each(exports.aliases, function(alias) {
			fieldTypes[alias] = exports;
		});
	}
});

/**Returns a specific relinker.
 * This is useful for wikitext rules which need to parse a filter or a list
 */
exports.getRelinker = function(name) {
	return fieldTypes[name];
};

exports.getAttributes = function(options) {
	return getSettings(options).attributes;
};

exports.getFields = function(options) {
	return getSettings(options).fields;
};

exports.getMacros = function(options) {
	return getSettings(options).macros;
};

exports.getOperators = function(options) {
	return getSettings(options).operators;
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
exports.factories = {
	attributes: function(attributes, tiddler, key) {
		var relinker = fieldTypes[tiddler.fields.text];
		if (relinker) {
			var elem = root(key);
			var attr = key.substr(elem.length+1);
			attributes[elem] = attributes[elem] || Object.create(null);
			attributes[elem][attr] = relinker;
		}
	},
	fields: function(fields, tiddler, name) {
		var relinker = fieldTypes[tiddler.fields.text];
		if (relinker) {
			fields[name] = relinker;
		}
	},
	macros: function(macros, tiddler, key) {
		var relinker = fieldTypes[tiddler.fields.text];
		if (relinker) {
			// We take the last index, not the first, because macro
			// parameters can't have slashes, but macroNames can.
			var name = dir(key);
			var arg = key.substr(name.length+1);
			macros[name] = macros[name] || Object.create(null);
			macros[name][arg] = relinker;
		}
	},
	operators: function(operators, tiddler, name) {
		var relinker = fieldTypes[tiddler.fields.text];
		if (relinker) {
			operators[name] = relinker;
		}
	}
};

/**We're caching the generated settings inside of options. Not exactly how
 * options was meant to be used, but it's fiiiiine.
 * The wiki global cache isn't a great place, because it'll get cleared many
 * times during a bulk relinking operation, and we can't recalculate this every
 * time without exploding a rename operation's time.
 * options works great. It only lasts just as long as the rename.
 * No longer, no shorter.
 */
function getSettings(options) {
	var secretCache = "__relink_settings";
	var cache = options[secretCache];
	if (cache === undefined) {
		cache = options[secretCache] = compileSettings(options.wiki);
	}
	return cache;
};

function compileSettings(wiki) {
	var prefix = "$:/config/flibbles/relink/";
	var settings = Object.create(null);
	for (var name in exports.factories) {
		settings[name] = Object.create(null);
	}
	wiki.eachShadowPlusTiddlers(function(tiddler, title) {
		if (title.substr(0, prefix.length) === prefix) {
			var remainder = title.substr(prefix.length);
			var category = root(remainder);
			var factory = exports.factories[category];
			if (factory) {
				var name = remainder.substr(category.length+1);
				factory(settings[category], tiddler, name);
			}
		}
	});
	return settings;
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
