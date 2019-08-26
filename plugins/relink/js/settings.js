/*\
module-type: library

This handles the fetching and distribution of relink settings.

\*/

var fieldTypes = Object.create(null);
$tw.modules.applyMethods('relinkfieldtype', fieldTypes);

// TODO: This is temporary until I get a better setup
// In reality, I should have the fieldType modules supply more than just a
// function. They should specify their name. and Allow for a possible delinker.
for (var type in fieldTypes) {
	fieldTypes[type].name = type;
}

/**Returns a specific relinker.
 * This is useful for wikitext rules which need to parse a filter or a list
 */
exports.getRelinker = function(name) {
	return fieldTypes[name];
};

exports.getFields = function(options) {
	return getSettings(options).fields;
};

exports.getOperators = function(options) {
	return getSettings(options).operators;
};

exports.getAttributes = function(options) {
	return getSettings(options).attributes;
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
	/* The config tiddlers require "title" as text. ("yes" for legacy)
	 * This is so shadow because in theory, we may need to support other
	 * field types. I know there are TextReferences in some, and enlist
	 * is a list. We may need to support that some day.
	 */
	operators: function(operators, tiddler, name) {
		if (tiddler.fields.text === "title" || tiddler.fields.text === "yes") {
			operators[name] = true;
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
		if (title.startsWith(prefix)) {
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

function root(string) {
	var index = string.indexOf('/');
	if (index >= 0) {
		return string.substr(0, index);
	}
};
