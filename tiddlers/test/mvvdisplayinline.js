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
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
};

beforeEach(function() {
	spyOn(console, 'log');
});

it('pretty varname', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf("tag", "title"));
	testText("B ((( from ))) A", true, ['((()))']);
	testText("B ((( [tag[from]] ))) A", true, ['((([tag[]])))'], {wiki: wiki});
	testText("B (((  from  ))) A", true, ['((()))'], {wiki: wiki});
});

// TODO: Locally defined macros

});
