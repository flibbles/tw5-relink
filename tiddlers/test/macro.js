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
	var t = testText("Macro <<test stuff 'from here' '[[from here]]' '[tag[from here]]'>>.");
	//var wiki = new $tw.Wiki();
	//var widget = wiki.relinkGlobalMacros();
	//console.log(widget);
	//console.log("INFO", widget.getVariableInfo("tabs"));
});

});
