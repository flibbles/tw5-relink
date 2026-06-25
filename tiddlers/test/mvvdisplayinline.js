/*\

Tests mvvdisplayinline, such as ((this)) or (((this))).

\*/

var mvvdisplayinlineAllowed = $tw.wiki.renderText(null, null, "\\procedure X() yes\n((X))") === "yes";

(mvvdisplayinlineAllowed? describe: xdescribe)
("mvv display inline", function() {

var utils = require("./utils");
var variablePrefix = "$:/temp/flibbles/relink-variables/";

function testText(text, expected, report, options) {
	options = Object.assign({from: 'from', to: 'to'}, options);
	const wiki = options.wiki || new $tw.Wiki();
	if (expected === true) {
		expected = text.split(options.from).join(options.to);
	} else if (expected === false) {
		expected = text;
	}
	wiki.addTiddlers([
		{title: 'test', text: text},
		utils.operatorConf("title")]);
	utils.failures.calls.reset();
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
	expect(utils.failures).toHaveBeenCalledTimes(options.fails || 0);
};

beforeEach(function() {
	spyOn(console, 'log');
	utils.spyFailures(spyOn);
});

it('pretty varname', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf("tag", "title"));
	testText("B ((( from ))) A", true, ['((()))']);
	testText("B ((( [tag[from]] ))) A", true, ['((([tag[]])))'], {wiki: wiki});
	testText("B (((  from  ))) A", true, ['((()))'], {wiki: wiki});
	testText("B ((( from ||-))) A", true, ['(((||-)))']);
	testText("B ((( [tag[from]]||-))) A", true, ['((([tag[]]||-)))'], {wiki: wiki});
});

it("handles impossibles gracefully", function() {
	testText("B ((( from ))) A", false, ['((()))'], {to: 't)))o', fails: 1});
	// Partial failure
	testText("B ((( from [tag{from}] ))) A",
	         "B ((( t}o [tag{from}] ))) A",
	         ['((()))', '((([tag{}])))'], {to: 't}o', fails: 1});
});

it("handles tricky filters", function() {
	testText("B (((from))) A", "B (((to) ))) A", ['((()))'], {to: 'to)'});
	testText("B (((from ))) A", true, ['((()))'], {to: 'to)'});
	testText("B (((from||-))) A", true, ['(((||-)))'], {to: 'to|'});
	testText("B (((from ||-))) A", true, ['(((||-)))'], {to: 'to|'});
});

it("introduces bars if necessary", function() {
	// Bars are fine if there is a separator specified
	testText("B (((from))) A", "B (((t||o||, ))) A", ['((()))'], {to: 't||o'});
	testText("B (((from))) A", "B (((t||||, ))) A", ['((()))'], {to: 't||'});
	testText("B (((from))) A", "B (((t||)||, ))) A", ['((()))'], {to: 't||)'});
});

it("recognizes and handles default separator", function() {
	testText("B (((fr|||, ))) A", "B (((to))) A", ['((()))'], {from: 'fr|'});
});

it("handles locally defined macros", function() {
	var defs = "\\procedure test(A B) <<A>><<B>>\n\\relink test B\n";
	testText(defs + "((( [<test B:from>] )))", true, ['((([<test B>])))']);
	testText(defs + "((( [<test X from>] )))", true, ['((([<test B>])))']);
});

});
