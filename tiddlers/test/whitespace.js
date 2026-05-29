/*\

Tests whitespace pragma.

\*/

describe('whitespace', function() {

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

it('does not interfere with later define', function() {
	const report = ['\\define test() {{}}'];
	test('\\whitespace trim\n\\define test() {{from here}}\n', report);
	test('\\whitespace trim\n\n\n\\define test() {{from here}}\n', report);
	test('\\whitespace trim\r\n\r\n\\define test() {{from here}}\n', report);
});

(utils.fnprocdefAllowed()? it: xit)
('does not interfere with later fndprocdef', function() {
	test('\\whitespace trim\n\\function test() [tag[from here]]\n');
	test('\\whitespace trim\n\n\n\\function test() [tag[from here]]\n');
	test('\\whitespace trim\r\n\r\n\\function test() [tag[from here]]\n');
});

(utils.spacesBeforePragmaAllowed()? it: xit)
("does not interfere even when spaces precede pragma", function() {
	test('\\whitespace trim\n    \\function test() [tag[from here]]\n');
});

});
