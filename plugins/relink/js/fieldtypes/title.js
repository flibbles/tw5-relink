/*\
This specifies logic for replacing a single-tiddler field. This is the
simplest kind of field type. One title swaps out for the other.
\*/

// NOTE TO MODDERS: If you're making your own field types, the name must be
//                  alpha characters only.
exports.name = 'title';

exports.report = function(value, callback, options) {
	if (value && !containsPlaceholder(value, options)) {
		callback(value);
	}
};

/**Returns undefined if no change was made.
 */
exports.relink = function(value, fromTitle, toTitle, options) {
	if (value !== fromTitle || containsPlaceholder(value, options)) {
		return undefined;
	} else if (containsPlaceholder(toTitle, options)) {
		return {impossible: true};
	} else {
		return {output: toTitle};
	}
};

function containsPlaceholder(value, options) {
	var dollar = value.indexOf('$');
	// Quick test. If no dollar signs. No placeholders.
	if (dollar >= 0 && value.indexOf('$', dollar+1)) {
		// We potentially have a placeholder
		var placeholders = options.settings.getPlaceholderList();
		if (placeholders) {
			if (value.search(/\$\([^$\)]+\)\$/) >= 0) {
				// A global placeholder exists
				return true;
			}
			for (var name in placeholders) {
				if (value.indexOf('$' + name + '$') >= 0) {
					// Oops. This contains a placeholder.
					return true;
				}
			}
		}
	}
	return false;
};

// This is legacy support for when 'title' was known as 'field'
exports.aliases = ['field', 'yes'];
