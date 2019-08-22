/*\
This manages replacing titles that occur within stringLists, like,

TiddlerA [[Tiddler with spaces]] [[Another Title]]
\*/

/**Returns undefined if no change was made.
 * Parameter: handler can return a value which is literally a list.
              This can happen for builtin types 'list' and 'tag'.
              In those cases, we also return list.
 */
exports.list = function(handler, fromTitle, toTitle, options) {
	var rawValue = handler.value(),
		isModified = false,
		actualList = false,
		list;
	if (typeof rawValue !== "string") {
		// Not a string. Must be a list.
		// clone it, since we may make changes to this possibly
		// frozen list.
		list = (rawValue || []).slice(0);
		actualList = true;
	} else {
		list = $tw.utils.parseStringArray(rawValue || "");
	}
	$tw.utils.each(list,function (title,index) {
		if(title === fromTitle) {
			handler.log('item', list[index], toTitle);
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
