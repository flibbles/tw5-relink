/*\
This manages replacing titles that occur within stringLists, like,

TiddlerA [[Tiddler with spaces]] [[Another Title]]
\*/

var titleRelinker = require('./title.js');

exports.name = "list";

exports.report = function(value, callback, options) {
	var list = $tw.utils.parseStringArray(value);
	for (var i = 0; i < list.length; i++) {
		titleRelinker.report(list[i], callback, options);
	}
};

/**Returns undefined if no change was made.
 * Parameter: value can literally be a list. This can happen for builtin
 *            types 'list' and 'tag'. In those cases, we also return list.
 */
exports.relink = function(value, fromTitle, toTitle, options) {
	var isModified = false,
		impossible = false,
		actualList = false,
		entry,
		list;
	if (typeof value !== "string") {
		// Not a string. Must be a list.
		// clone it, since we may make changes to this possibly
		// frozen list.
		list = (value || []).slice(0);
		actualList = true;
	} else {
		list = $tw.utils.parseStringArray(value || "");
	}
	$tw.utils.each(list,function (title,index) {
		var titleEntry = titleRelinker.relink(title, fromTitle, toTitle, options);
		if (titleEntry) {
			if (titleEntry.output) {
				list[index] = titleEntry.output;
				isModified = true;
			}
			if (titleEntry.impossible) {
				impossible = true;
			}
		}
	});
	if (isModified || impossible) {
		entry = {name: "list", impossible: impossible};
		// It doesn't parse correctly alone, it won't
		// parse correctly in any list.
		if (!canBeListItem(toTitle)) {
			entry.impossible = true;
		} else if (actualList) {
			entry.output = list;
		} else if (isModified) {
			entry.output = $tw.utils.stringifyList(list);
		}
	}
	return entry;
};

function canBeListItem(value) {
	var regexp = /\]\][^\S\xA0]/m;
	return !regexp.test(value);
};
