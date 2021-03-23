/*\

Tests the new relinking wiki methods.

\*/

var utils = require("test/utils");

function generateExpected(expected, input, options) {
};

function testFilter(filter, expected, report, options) {
	options = Object.assign({from: 'from here', to: 'to there', field: 'filt'}, options);
	if (expected === true) {
		expected = filter.split(options.from).join(options.to);
	} else if (expected === false) {
		expected = filter;
	}
	const wiki = options.wiki || new $tw.Wiki();
	wiki.addTiddlers([
		utils.fieldConf('filt', 'filter'),
		{title: 'test', filt: filter}]);
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to);
	expect(wiki.getTiddler('test').fields.filt).toEqual(expected);
};

describe("filter fields", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('relinks and logs', function() {
	var r = testFilter("A [[from here]] B", true, ['filt']);
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'test'");
});

it('quotes', function() {
	testFilter("A 'from here' B", true, ['filt']);
	testFilter('A "from here" B', true, ['filt']);
});

it('nonquotes', function() {
	testFilter("A from B", true, ['filt'], {from: 'from', to: 'to'});
});

it('loses brackets even if unnecessarily there', function() {
	testFilter("A [[from]] B", "A to B", ['filt'], {from: 'from', to: 'to'});
});

it('added spaces', function() {
	testFilter("A from B", "A [[to there]] B", ['filt'], {from: 'from'});
	testFilter("from", "[[to there]]", ['filt'], {from: 'from'});
});

it('spaces around brackets', function() {
	testFilter("A [[from here]] B", "A to B", ['filt'], {to: 'to'});
	testFilter("A\n[[from here]]\nB", "A\nto\nB", ['filt'], {to: 'to'});
	testFilter("A [[from here]]B", "A to B", ['filt'], {to: 'to'});
	testFilter("A[[from here]] B", "A to B", ['filt'], {to: 'to'});
	testFilter("[[from here]] B", "to B", ['filt'], {to: 'to'});
	testFilter("A [[from here]]", "A to", ['filt'], {to: 'to'});
	testFilter("[[from here]]", "to", ['filt'], {to: 'to'});
	testFilter("A[[B]]C [[from here]]", true, ['filt']);
	testFilter("A [[from here]] B", true, ['filt']);
	testFilter("A\n[[from here]]\nB", true, ['filt']);
	testFilter("A[[from here]] B", true, ['filt']);
	testFilter("A [[from here]]B", true, ['filt']);
	testFilter("A[[from here]]B", true, ['filt']);
	testFilter("   [[from here]]   ", true, ['filt']);
	testFilter("A[[from here]]B", "A \"to [it's]\" B", ['filt'], {to: "to [it's]"});
	testFilter("A[[from here]]B", "A 'to [\"it\"]' B", ['filt'], {to: 'to ["it"]'});
});

it('multiples', function() {
	testFilter("A [[f]] f B", 'A [[to there]] [[to there]] B', ['filt', 'filt'], {from: "f"});
});

it('runs', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('title'));
	testFilter("[get[a][a]has[a]]", '[get[a][to there]has[a]]', ['filt: [[]]'],
	           {from: "a", wiki: wiki});
	testFilter("[[here]has[x]]", true, ['filt: [[]]'], {from: "here", wiki: wiki});
});

it('title operator', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('title'));
	testFilter("A [title[from here]] B", true, ['filt: [title[]]'], {wiki: wiki});
	testFilter("A [title[from]] B", true, ['filt: [title[]]'], {from: 'from', wiki: wiki});
});

it('malformed', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('tag'));
	testFilter("[tag[from here]", false, undefined, {wiki: wiki});
	testFilter("[is[system]] +[tag[from here", false, undefined, {wiki: wiki});
	testFilter("[tag[from here]] [and[else]", false, undefined, {wiki: wiki});
});

it('tricky titles', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('title'));
	testFilter("A [[from here]] B", 'A "a\' ]b" B',   ['filt'], {to: 'a\' ]b'});
	testFilter("A [[from here]] B", "A 'a\" ]b' B",   ['filt'], {to: 'a\" ]b'});
	testFilter("A [[from here]] B", "A a\"\'b B",     ['filt'], {to: 'a\"\'b'});
	testFilter("A [[from here]] B", "A [[a\" \'b]] B",['filt'], {to: 'a\" \'b'});
	testFilter("A [title[from here]] B","A [title[a\" \'b]] B", ['filt: [title[]]'], {to: 'a\" \'b', wiki: wiki});
	testFilter("A [title[from here]] B","A [title[simple]] B", ['filt: [title[]]'], {to: 'simple', wiki: wiki});
	testFilter('A "from here" B', 'A [[a\' \"b]] B', ['filt'], {to: 'a\' "b'});
	testFilter("A 'from here' B", 'A [[a\' \"b]] B', ['filt'], {to: 'a\' "b'});
});

it('supports expression prefixes', function() {
	testFilter("A +[[from here]] B", true, ['filt: +']);
	testFilter("A -from B", true, ['filt: -'], {from: "from", to: "to"});
	testFilter("[tag[A]] -from C", "[tag[A]] -'X[\"]Y' C", ['filt: -'], {from: "from", to: "X[\"]Y"});
	testFilter("A ~from B", "A ~[[to there]] B", ['filt: ~'], {from: "from"});
	testFilter("A =[[from here]] B", "A =to B", ['filt: ='], {to: "to"});
	testFilter("A [[B]]+from", true, ['filt: +'], {from: "from", to: "to"});
	testFilter("A [[from here]]+B", "A to +B", ['filt'], {to: "to"});
	testFilter("A [[from here]]+B", "A to +B", ['filt'], {to: "to"});

	// named prefixes
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('tag'));
	testFilter("A +[tag[from here]]", true, ['filt: +[tag[]]'], {wiki: wiki});
	testFilter("A +[be{from here}]", true, ['filt: +[be{}]'], {wiki: wiki});
});

it('supports operator negator on titles', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.operatorConf('title'),
		utils.operatorConf('tag')]);
	testFilter("A [![from here]]", true, ['filt: [![]]'], {wiki: wiki});
	testFilter("A [!title[from here]]", true, ['filt: [!title[]]'], {wiki: wiki});
	testFilter("A [tag[something]!title[from here]]", true, ['filt: [!title[]]'], {wiki: wiki});
	// Doesn't try to collapse the brackets or anything
	testFilter("A [![from here]]", true, ['filt: [![]]'], {to: "to", wiki: wiki});
});

it('ignores other operators', function() {
	testFilter("A [has[from here]] B", false);
	testFilter("A [field:other[from here]] B", false);
});

it('ignores variables', function() {
	testFilter("A [title<from>] B", false, undefined, {from: "from"});
	testFilter("A [<from>] B", false, undefined, {from: "from"});
});

it('ignores regular expressions', function() {
	testFilter("[regexp/rxp/] [[from here]] B", true, ['filt']);
	testFilter("A [title/from/] B", false, undefined, {from: "from"});
});

it('handles transclusion for all operands', function() {
	testFilter("A [title{from}] B", true, ['filt: [title{}]'], {from: "from"});
	testFilter("A [{from}] B", true, ['filt: [{}]'], {from: "from"});
	testFilter("A [anything{from}] B", true, ['filt: [anything{}]'], {from: "from"});
	testFilter("A [anything{from!!field}] B", true, ['filt: [anything{!!field}]'], {from: "from"});
	testFilter("A [anything{from##index}] B", true, ['filt: [anything{##index}]'], {from: "from"});
	testFilter("[[Title]addsuffix{from!!field}]", true, ['filt: [addsuffix{!!field}]'], {from: "from"});
});

it('field:title operator', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.operatorConf("field:title", "reference"),
		utils.operatorConf("title", "title")]);
	testFilter("A [field:title[from here]] B", true, ['filt: [field:title[]]'], {wiki: wiki});
	testFilter("A [!field:title[from here]] B", true, ['filt: [!field:title[]]'], {wiki: wiki});
	testFilter("[title:randomsuffix[from here]]", true, ['filt: [title:randomsuffix[]]'], {wiki: wiki});
	testFilter("A [tag[something]!field:title[from here]] B", true, ['filt: [!field:title[]]'], {wiki: wiki});
});

it('list type operator', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('enlist', 'list'));
	testFilter('[enlist[A from B]]', true, ['filt: [enlist[]]'], {from: 'from', to: 'to', wiki: wiki});
});

it('filter type operator', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('subfilter', 'filter'));
	testFilter('[subfilter["from"]]', true, ['filt: [subfilter[]]'], {from: 'from', wiki: wiki});
});

it('prioritizes suffixed operator defs', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf("test:ref", "reference"));
	wiki.addTiddler(utils.operatorConf("test", "title"));
	testFilter("[test[from here]]", true, ['filt: [test[]]'], {wiki: wiki});
	testFilter("[test[from here!!F]]", false, undefined, {wiki: wiki});
	testFilter("[test:ref[from here!!F]]", true, ['filt: [test:ref[!!F]]'], {wiki: wiki});
});

it('manages reference types as operands', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('list', 'reference'));
	testFilter("A [list[from here]] B", true, ['filt: [list[]]'], {wiki: wiki});
	testFilter("A [list[from here!!field]] B", true, ['filt: [list[!!field]]'], {wiki: wiki});
	testFilter("A [list[from here##index]] B", true, ['filt: [list[##index]]'], {wiki: wiki});
});

it('manages multiple operands with mixed types', function() {
	const wiki = new $tw.Wiki();
	const options = {wiki: wiki, from: 'from', to: 'to'};
	wiki.addTiddler(utils.operatorConf('test', 'reference', 3));
	testFilter('A [test[from],{from},[from]]', 'A [test[from],{to},[to]]',
	           ['filt: [test,{}]', 'filt: [test,,[]]'], options);
});

it('handles malformed multi-operand filters', function() {
	const wiki = new $tw.Wiki();
	const options = {wiki: wiki, from: 'from', to: 'to'};
	wiki.addTiddler(utils.operatorConf('test', 'title', 2));
	testFilter('[test[from]!,[from]]', false, undefined, options);
	testFilter('[test[from],d[from]]', false, undefined, options);
	testFilter('[test[from],[from}]', false, undefined, options);
	testFilter('[test[from],[from]', false, undefined, options);
	testFilter('[test[from],[from', false, undefined, options);
});

it('manages multiple operands with different suffix settings', function() {
	const wiki = new $tw.Wiki();
	const options = {wiki: wiki, from: 'from', to: 'to'};
	wiki.addTiddler(utils.operatorConf('main', 'title', 1));
	wiki.addTiddler(utils.operatorConf('main:sub', 'title', 2));
	wiki.addTiddler(utils.operatorConf('alt', 'title', 2));
	wiki.addTiddler(utils.operatorConf('alt:sub', 'title', 1));
	testFilter('A [main[from],[from]prefix[from]]', 'A [main[to],[from]prefix[from]]', ['filt: [main[]]'], options);
	testFilter('A [main:sub[from],[from]prefix[from]]', 'A [main:sub[to],[to]prefix[from]]', ['filt: [main:sub[]]', 'filt: [main:sub,[]]'], options);

	testFilter('A [alt[from],[from]prefix[from]]', 'A [alt[from],[to]prefix[from]]', ['filt: [alt,[]]'], options);
	testFilter('A [alt:sub[from],[from]prefix[from]]', 'A [alt:sub[to],[to]prefix[from]]', ['filt: [alt:sub[]]', 'filt: [alt:sub,[]]'], options);
});

it('ignores blank tag configurations', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf("empty", ""));
	testFilter("[[A]] [empty[A]]", "[[to there]] [empty[A]]", ['filt'], {from: "A", wiki: wiki});
});

it('ignores non-title tag configurations', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf("bad", "eh?"));
	testFilter("[[A]] [bad[A]]", "[[to there]] [bad[A]]", ['filt'], {from: "A", wiki: wiki});
});

it('field failures', function() {
	function fails(filter, toTitle, report) {
		const wiki = new $tw.Wiki();
		const options = {to: toTitle, wiki: wiki};
		wiki.addTiddlers([
			utils.operatorConf('wiki', 'wikitext'),
			utils.operatorConf('tag')]);
		const fails = utils.collectFailures(function() {
			testFilter(filter, false, report, options);
		});
		expect(fails.length).toEqual(1);
	};
	fails("[tag[from here]]", "brackets]there", ['filt: [tag[]]']);
	fails("[[from here]]", "A\"bad'stupid]title", ['filt']);
	fails("[{from here}]", "A\"bad'stupid}title", ['filt: [{}]']);
	fails("[tag{from here}]", "brackets}there", ['filt: [tag{}]']);
	fails("[tag{from here!!field}]", "brackets}there", ['filt: [tag{!!field}]']);
	// wikitext
	fails("[wiki[transclude {{from here!!C}}]]", "A]]B", ['filt: [wiki[{{!!C}}]]']);
	fails("[wiki[transclude {{from here}}]]", "A}} 'B\"", ['filt: [wiki[{{}}]]']);
});

it("field failures don't prevent from continuing", function() {
	function fail(filter, toTitle, expected, report, failures) {
		const wiki = new $tw.Wiki();
		wiki.addTiddlers([
			utils.operatorConf('list', 'reference'),
			utils.operatorConf('title'),
			utils.operatorConf('tag')]);
		const options = {from: "from", to: toTitle, wiki: wiki};
		const fails = utils.collectFailures(function() {
			testFilter(filter, expected, report, options);
		});
		expect(fails.length).toEqual(failures);
	};
	fail("from [tag{from}]", "to]'\"there",
	     "from [tag{to]'\"there}]", ['filt', 'filt: [tag{}]'], 1);
	fail("[tag[from]tag{from}]", "to}there",
	     "[tag[to}there]tag{from}]", ['filt: [tag[]]', 'filt: [tag{}]'], 1);
	fail("[tag[from]tag{from}]", "to]there",
	     "[tag[from]tag{to]there}]", ['filt: [tag[]]', 'filt: [tag{}]'], 1);
	fail("[tag[from]tag{from}]", "t!!f",
	     "[tag[t!!f]tag{from}]", ['filt: [tag[]]', 'filt: [tag{}]'], 1);

	// properly counts failures
	fail("[tag[from]title[from]tag{from}]", "1]2",
	     "[tag[from]title[from]tag{1]2}]", ['filt: [tag[]]', 'filt: [title[]]', 'filt: [tag{}]'], 1);

	// Reference operand properly fails
	fail("[list[from]tag[from]]", "t!!f",
	     "[list[from]tag[t!!f]]", ['filt: [list[]]', 'filt: [tag[]]'], 1);
});

it('handles named filter run prefixes', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('tag'));
	testFilter("[tag[from here]] :reduce[add<accumulator>add{from here!!value}]", true, ['filt: [tag[]]', 'filt: :reduce[add{!!value}]'], {wiki: wiki});
	testFilter(":reduce[[from here]]", true, ['filt: :reduce'], {wiki: wiki});
	// Bad prefixes don't technically make illegal filters, just filters that return errors.
	testFilter("[tag[from here]] :badprefix[add<accumulator>add{from here!!value}]", true, ['filt: [tag[]]', 'filt: :badprefix[add{!!value}]'], {wiki: wiki});
});

/** This is legacy support. Originally, the value of the configuration tiddlers
 *  was set to "yes" because I didn't think it really mattered, but it turns
 *  out it may actually be other values one day, so I'm switching it to title
 *  sooner rather than later.
 */
it("but it doesn't ignore 'yes' configurations", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf("good", "yes"));
	testFilter("[[A]] [good[A]]", true, ['filt', 'filt: [good[]]'], {from: "A", wiki: wiki});
});

});
