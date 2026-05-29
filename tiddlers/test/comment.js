/*\

Tests comments in wikitext.

\*/

describe('comment', function() {

var utils = require("./utils");

beforeEach(function() {
	spyOn(console, 'log');
});

function test(text, report) {
	const wiki = new $tw.Wiki();
	report = report || ['\\function test() [tag[]]'];
	wiki.addTiddler({title: 'test', text: text});
	wiki.addTiddler(utils.operatorConf('tag'));
	expect(utils.getReport('test', wiki)['from here']).toEqual(report);
	wiki.renameTiddler('from here', 'to there', {wiki: wiki});
	expect(utils.getText('test', wiki)).toEqual(text.split('from here').join('to there'));
};

it('does not interfere with define', function() {
	const report = ['\\define test() {{}}'];
	test('<!-- Comment -->\n\\define test() {{from here}}\n', report);
	test('<!--\n\nComment\n\n-->\n\\define test() {{from here}}\n', report);
});

(utils.fnprocdefAllowed()? it: xit)
('does not interfere with fnprocdef', function() {
	test('<!-- Comment -->\n\\function test() [tag[from here]]\n');
	test('<!--\n\nComment\n\n-->\n\\function test() [tag[from here]]\n');
});

(utils.spacesBeforePragmaAllowed()? it: xit)
("does not interfere even when spaces precede pragma", function() {
	test('<!-- Comment -->\\function test() [tag[from here]]\n');
	test('<!--\n\nComment\n\n-->\n  \\function test() [tag[from here]]\n');
});

});
