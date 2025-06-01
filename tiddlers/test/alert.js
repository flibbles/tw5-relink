/*\

Tests Relink's ability to alert the user when impossible relinks had to
be skipped over.

\*/

var utils = require("./utils");
var Logger = $tw.utils.Logger.prototype;

function testAlert(wiki, tiddlers, browser) {
	wiki.addTiddlers([
		{title: "$:/plugins/flibbles/relink/language/Error/ReportFailedRelinks", text: "<<from>>-<<to>>"},
		{title: "from here"}]);
	for (var i = 0; i < tiddlers.length; i++) {
		wiki.addTiddler({
			title: tiddlers[i],
			text: "{{{[tag{from here}]}}}"});
	}
	spyOn(Logger, 'alert');
	// deliberately not passing options.
	// renameTiddler should work without it.
	wiki.renameTiddler("from here", "to}}there");
	// There should only ever be a single alert, no matter how many failed
	// relinks there were.
	expect(Logger.alert).toHaveBeenCalledTimes(1);
	var expectedMessage = "from here-to}}there";
	var results = Logger.alert.calls.first().args;
	expect(results[0]).toContain(expectedMessage);
	return results[0];
};

describe('failure alerts', function() {

beforeEach(function() {
	// We're just suppressing the log here.
	spyOn(console, 'log');
});

it("single alert for multiple tiddlers", function() {
	var message = testAlert(new $tw.Wiki(), ["TiddlerA", "TiddlerB"], true);
	expect(message).toContain("TiddlerA");
	expect(message).toContain("TiddlerB");
});

it("tiddlers with multiple errors only list once", function() {
	var wiki = new $tw.Wiki();
	var title = "Tiddles";
	wiki.addTiddler({
		title: title,
		text: "{{{[tag{from here}]}}} {{{[list{from here}]}}}"});
	var message = testAlert(wiki, [], true);
	var index = message.indexOf(title);
	expect(index).toBeGreaterThanOrEqual(0);
	index = message.indexOf(title, index + title.length);
	expect(index).toBeLessThan(0);
});

// This won't render correctly if the tiddler has brackets in it,
// but it's not worth the trouble I'm going to to make sure it's still okay.
it("pretty titles", function() {
	var message = testAlert(new $tw.Wiki(), ["Pretty"], true);
	expect(message).toContain("Pretty");
});

if (!$tw.browser) it("prints simple if not on browser", function() {
	// This block has nothing to do with the test.
	// But if testAlert ends up running before the wikitext relinker
	// instantiates, then it'll fail because the browser will think
	// it's NodeJS, which it isn't, and we can't have that confusion
	// when executing modules. So we do this dummy stuff just to
	// force the instantiation before we get to work.
	var tmpWiki = new $tw.Wiki();
	tmpWiki.addTiddler({title: "test", text: "[[A]]"});
	tmpWiki.renameTiddler("A", "B");

	var message = testAlert(new $tw.Wiki(), ["TidA", "Tid]]B"]);
	expect(message).toContain("TidA");
	expect(message).not.toContain("[[TidA]]");
	expect(message).toContain("Tid]]B");
	expect(message).not.toContain("<$text");
	expect(message).not.toContain("\\define");
});

});
