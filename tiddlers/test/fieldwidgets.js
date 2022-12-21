/*\

Tests html elements that take tiddler fields as  attributes.

\*/

var utils = require("test/utils");

function testText(text, expected, report, options) {
	options = Object.assign({from: 'from here', to: 'to there'}, options);
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

describe("html fieldwidgets", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('works', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.fieldConf("myfield"),
		utils.fieldConf("mylist", "list"),
		$tw.wiki.getTiddler("$:/config/flibbles/relink/fieldwidgets/$action-createtiddler"),
		$tw.wiki.getTiddler("$:/config/flibbles/relink/fieldwidgets/$jsontiddler")]);
	testText('<$action-createtiddler myfield="from here" />', true,
	         ['<$action-createtiddler myfield />'], {wiki: wiki});
	testText('<$action-createtiddler mylist="[[from here]] X" />', true,
	         ['<$action-createtiddler mylist />'], {wiki: wiki});
});

// TODO: Whitelist can change on the fly

});
