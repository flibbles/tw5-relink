/*\

Tests macros.

\*/

var utils = require("test/utils");

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	options.wiki.addTiddlers([
		utils.macroConf("test", "Btitle"),
		utils.macroConf("test", "Clist", "list"),
		utils.macroConf("test", "Dfilter", "filter"),
		{title: "testMacro", tags: "$:/tags/Macro",
		 text: "\\define test(A, Btitle, Clist, Dfilter) stuff\n"}
	]);
	var results = utils.relink({text: text}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	return results;
};

describe("macro", function() {

it('macro', function() {
	//var t = testText("Macro <<test stuff 'from here' '[[from here]]' '[tag[from here]]'>>.");
});

it('keeps up to date with macro changes', function() {
	var wiki = new $tw.Wiki();
	var t = testText("Macro <<test stuff 'from here'>>.", {wiki: wiki});
	var oldTick = $tw.utils.nextTick;
	try {
		$tw.utils.nextTick = function(fn) {fn()};
		wiki.eventsTriggered = false;
		wiki.addTiddler({ title: "testMacro", tags: "$:/tags/Macro",
			text: "\\define test(Btitle) title is first now\n"});
	} finally {
		$tw.utils.nextTick = oldTick;
	}

	// Btitle is the first argument now. Relink should realize that.
	// DON'T USE testText, because that'll reoverwrite the new testMacro
	t = utils.relink({text: "Macro <<test 'from here'>>."}, {wiki: wiki});
	expect(t.tiddler.fields.text).toEqual("Macro <<test 'to there'>>.");
});

});
