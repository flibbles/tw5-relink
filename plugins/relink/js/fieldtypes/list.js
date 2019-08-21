/*\
This manages replacing titles that occur within stringLists, like,

TiddlerA [[Tiddler with spaces]] [[Another Title]]
\*/

/**Returns undefined if no change was made.
 */
exports.list = function(handler, fromTitle, toTitle) {
	var list = $tw.utils.parseStringArray(handler.value() || ""),
		isModified = false;
	$tw.utils.each(list,function (title,index) {
		if(title === fromTitle) {
			handler.log('item', list[index], toTitle);
			list[index] = toTitle;
			isModified = true;
		}
	});
	if (isModified) {
		return $tw.utils.stringifyList(list);
	}
	return undefined;
};
