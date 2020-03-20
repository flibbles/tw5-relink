/*\
This manages replacing titles that occur within stringLists, like,

TiddlerA [[Tiddler with spaces]] [[Another Title]]
\*/

exports.name = "list";

/**Returns undefined if no change was made.
 * Parameter: value can literally be a list. This can happen for builtin
 *            types 'list' and 'tag'. In those cases, we also return list.
 */
exports.relink = function(value, fromTitle, toTitle, logger, options) {
	var isModified = false,
		actualList = false,
		list,
		output;
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
		if(title === fromTitle) {
			list[index] = toTitle;
			isModified = true;
		}
	});
	if (isModified) {
		// It doesn't parse correctly alone, it won't
		// parse correctly in any list.
		if (!canBeListItem(toTitle)) {
			logger.add({name: "list", impossible: true});
		} else if (actualList) {
			output = list;
		} else {
			output = $tw.utils.stringifyList(list);
		}
	}
	return output;
};

function canBeListItem(value) {
	var regexp = /\]\][^\S\xA0]/m;
	return !regexp.test(value);
};
