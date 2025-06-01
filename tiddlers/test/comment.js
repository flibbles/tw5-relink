/*\

Tests comments in wikitext.

\*/

describe('comment', function() {

var utils = require("./utils");

beforeEach(function() {
	spyOn(console, 'log');
});

function test(text) {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'test', text: text});
	wiki.addTiddler(utils.operatorConf('tag'));
	expect(utils.getReport('test', wiki)['from here']).toEqual(['\\function test() [tag[]]']);
	wiki.renameTiddler('from here', 'to there', {wiki: wiki});
	expect(utils.getText('test', wiki)).toEqual(text.split('from here').join('to there'));
};

it('does not interfere with pragma', function() {
	test('<!-- Comment -->\n\\function test() [tag[from here]]\n');
	test('<!-- Comment -->\\function test() [tag[from here]]\n');
	test('<!--\n\nComment\n\n-->\n  \\function test() [tag[from here]]\n');
});

});
