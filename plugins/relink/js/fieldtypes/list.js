/*\
This manages replacing titles that occur within stringLists, like,

TiddlerA [[Tiddler with spaces]] [[Another Title]]
\*/

/**Returns undefined if no change was made.
 * Parameter: value can literally be a list. This can happen for builtin
 *            types 'list' and 'tag'. In those cases, we also return list.
 */
exports.list = function(value, fromTitle, toTitle, options) {
	var isModified = false,
		actualList = false,
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
		if(title === fromTitle) {
			list[index] = toTitle;
			isModified = true;
		}
	});
	if (isModified) {
		if (actualList) {
			return list;
		} else {
			return $tw.utils.stringifyList(list);
		}
	}
	return undefined;
};
