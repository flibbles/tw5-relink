/*\

Tests the new relinking wiki methods.

\*/

var utils = require("./utils");

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
		utils.operatorConf('title'),
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
	testFilter("A[[from here]]B", "A to B", ['filt'], {to: 'to'});
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
	testFilter("   from   ", true, ['filt'], {from: "from", to: "to"});
	testFilter("   [[from here]]   ", "   to   ", ['filt'], {to: "to"});
	testFilter("A[[from here]]B", "A \"to [it's]\"B", ['filt'], {to: "to [it's]"});
	testFilter("A[[from here]]B", "A 'to [\"it\"]'B", ['filt'], {to: 'to ["it"]'});
});

it('multiples', function() {
	testFilter("A [[f]] f B", 'A [[to there]] [[to there]] B', ['filt', 'filt'], {from: "f"});
});

it('runs', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('title'));
	testFilter("[get[a][a]has[a]]", '[get[a][to there]has[a]]', ['filt: [[]has...]'],
	           {from: "a", wiki: wiki});
	testFilter("[[here]has[x]]", true, ['filt: [[]has...]'], {from: "here", wiki: wiki});
	testFilter("[[from here]]", true, ['filt'], {wiki: wiki});
	testFilter("-[[from here]]", true, ['filt: -'], {wiki: wiki});
	testFilter("[[from here]tagging[]]", true, ['filt: [[]tagging...]'], {wiki: wiki});
	testFilter("[[from here]!prefix[f]]", true, ['filt: [[]!prefix...]'], {wiki: wiki});
	testFilter("[[from here]search::literal[f]]", true, ['filt: [[]search::literal...]'], {wiki: wiki});
	// This one is weird. It shouldn't happen, but it could.
	testFilter("[[from here][f]]", true, ['filt: [[]...]'], {wiki: wiki});
	testFilter("+[[from here]tagging[]]", true, ['filt: +[[]tagging...]'], {wiki: wiki});
});

it('title operator', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('title'));
	testFilter("A [title[from here]] B", true, ['filt'], {wiki: wiki});
	testFilter("A [!title[from here]] B", true, ['filt: [![]]'], {wiki: wiki});
	testFilter("A [![from here]] B", true, ['filt: [![]]'], {wiki: wiki});
	testFilter("A [title[from here]is[tiddler]] B", true, ['filt: [[]is...]'], {wiki: wiki});
	testFilter("A ~[title[from here]] B", true, ['filt: ~'], {wiki: wiki});
	testFilter("A ~[!title[from here]] B", true, ['filt: ~[![]]'], {wiki: wiki});
});

it('contains operator', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.fieldConf('tags', 'list'),
		utils.fieldConf('mytitle'),
		utils.fieldConf('contains', 'reference'),
		utils.fieldConf('myfilter', 'filter'),
		utils.fieldConf('myreference', 'reference'),
		utils.fieldConf('list', 'list')]);
	// It doesn't relink implicit list unless list is added
	testFilter("A [contains[from here]] B", false);
	testFilter("A [contains[from here]] B", true, ['filt: [contains[]]'], {wiki: wiki});
	testFilter("A [contains:list[from here]] B", true, ['filt: [contains:list[]]'], {wiki: wiki});
	testFilter("A [contains:tags[from here]] B", true, ['filt: [contains:tags[]]'], {wiki: wiki});
	// title fields don't work with contains. Ignore.
	testFilter("A [contains:mytitle[from here]] B", false, undefined, {wiki: wiki});
	// references aren't meant to work with contains either
	testFilter("A [contains:myreference[from here]] B", false, undefined, {wiki: wiki});
	// Filters aren't supposed to be used, but conceivably they could be
	testFilter("A [contains:myfilter[from here]] B", true, ['filt: [contains:myfilter[]]'], {wiki: wiki});
	testFilter("A [contains:none[from here]] B", false, undefined, {wiki: wiki});
	// This makes sure that the fieldConf('contains') we added doesn't
	// get mistaken as a field operator. Contains is an existing filter
	// operator. It's never a field operator.
	testFilter("A [contains[from here!!title]] B", false, undefined, {wiki: wiki});
});

it('filter filter operators', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('filter', 'filter'));
	testFilter("A +[filter['from here']]", true, ['filt: +[filter[]]'], {wiki: wiki});
	testFilter("A +[filter[from here]]", false, undefined, {wiki: wiki});
	testFilter("A +[filter[from]]", true, ['filt: +[filter[]]'], {from: 'from', to: 'to', wiki: wiki});
	utils.spyFailures(spyOn);
	testFilter("A +[filter[from]]", false, ['filt: +[filter[]]'], {from: 'from', wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
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
	testFilter("A [title[from here]] B","A [title[a\" \'b]] B", ['filt'], {to: 'a\" \'b', wiki: wiki});
	testFilter("A [title[from here]] B","A [title[simple]] B", ['filt'], {to: 'simple', wiki: wiki});
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

it('handles titles that would conflict with prefixes', function() {
	// ~to alone would be incorrect
	testFilter("A from B", "A [[~to]] B", ['filt'], {from: 'from', to: '~to'});
	testFilter("A from B", "A '~t]o' B", ['filt'], {from: 'from', to: '~t]o'});
	testFilter("A from B", 'A "~t]\'o" B', ['filt'], {from: 'from', to: '~t]\'o'});
	// All symbol prefixes work
	testFilter("A from B", "A [[+to]] B", ['filt'], {from: 'from', to: '+to'});
	testFilter("A from B", "A [[-to]] B", ['filt'], {from: 'from', to: '-to'});
	testFilter("A from B", "A [[=to]] B", ['filt'], {from: 'from', to: '=to'});
	testFilter("A from B", "A [[:to]] B", ['filt'], {from: 'from', to: ':to'});
	// Goes back to the way it was
	testFilter("A [[:from]] B", "A to B", ['filt'], {from: ':from', to: 'to'});
});

it('supports operator negator on titles', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.operatorConf('title'),
		utils.operatorConf('tag')]);
	testFilter("A [![from here]]", true, ['filt: [![]]'], {wiki: wiki});
	testFilter("A [!title[from here]]", true, ['filt: [![]]'], {wiki: wiki});
	testFilter("A [tag[something]!title[from here]]", true, ['filt: [![]]'], {wiki: wiki});
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
	testFilter("A [title{from}] B", true, ['filt: [{}]'], {from: "from"});
	testFilter("A ~[title{from}] B", true, ['filt: ~[{}]'], {from: "from"});
	testFilter("A [!title{from}] B", true, ['filt: [!{}]'], {from: "from"});
	testFilter("A [{from}] B", true, ['filt: [{}]'], {from: "from"});
	testFilter("A [anything{from}] B", true, ['filt: [anything{}]'], {from: "from"});
	testFilter("A [anything{from!!field}] B", true, ['filt: [anything{!!field}]'], {from: "from"});
	testFilter("A [anything{from##index}] B", true, ['filt: [anything{##index}]'], {from: "from"});
	testFilter("[[Title]addsuffix{from!!field}]", true, ['filt: [addsuffix{!!field}]'], {from: "from"});
});

it('handles variables for all operands', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.operatorConf("tag", "list"),
		utils.macroConf("test", "arg"),
		utils.macroConf("test", "list", "list"),
		{title: "Macros", tags: "$:/tags/Macro", text: "\\define test(arg, list) A-$arg$-$list$-B"}]);
	testFilter("A [tag<test from>] B", "A [tag<test 'to there'>] B", ['filt: [tag<test arg>]'], {from: 'from', wiki: wiki});
	testFilter("A [tag<test list:'C from'>] B", "A [tag<test list:'C [[to there]]'>] B", ['filt: [tag<test list>]'], {from: 'from', wiki: wiki});
	testFilter("A [tag<test list: from>] B", "A [tag<test list: '[[to there]]'>] B", ['filt: [tag<test list>]'], {from: 'from', wiki: wiki});
	// Cases where it can't work
	utils.spyFailures(spyOn);
	testFilter("A [tag<test from>] from", "A [tag<test from>] t>o", ['filt: [tag<test arg>]', 'filt'], {from: 'from', to: 't>o', wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	utils.failures.calls.reset();
	testFilter("A [tag<test from>] [{from!!title}]", "A [tag<test from>] [{t' ]]\"!!title}]", ['filt: [tag<test arg>]', 'filt: [{!!title}]'], {from: 'from', to: 't\' ]]\"', wiki: wiki});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('field:title operator', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.operatorConf("field:title", "reference"),
		utils.operatorConf("title", "title"),
		utils.fieldConf("myfield"),
		utils.fieldConf("addprefix")]); // addprefix is an existing operator that's not whitelisted
	testFilter("A [field:title[from here]] B", true, ['filt: [field:title[]]'], {wiki: wiki});
	testFilter("A [!field:title[from here]] B", true, ['filt: [!field:title[]]'], {wiki: wiki});
	testFilter("[title:randomsuffix[from here]]", true, ['filt: [:randomsuffix[]]'], {wiki: wiki});
	testFilter("A [tag[something]!field:title[from here]] B", true, ['filt: [!field:title[]]'], {wiki: wiki});
	testFilter("[[A]myfield[from here]]", true, ['filt: [myfield[]]'], {wiki: wiki});
	// This one shouldn't do anything because addprefix is an actual operator
	testFilter("[[A]addprefix[from here]]", false, undefined, {wiki: wiki});
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
		utils.failures.calls.reset();
		testFilter(filter, false, report, options);
		expect(utils.failures).toHaveBeenCalledTimes(1);
	};
	utils.spyFailures(spyOn);
	fails("[tag[from here]]", "brackets]there", ['filt: [tag[]]']);
	fails("[[from here]]", "A\"bad'stupid]title", ['filt']);
	fails("[{from here}]", "A\"bad'stupid}title", ['filt: [{}]']);
	fails("[tag{from here}]", "brackets}there", ['filt: [tag{}]']);
	fails("[tag{from here!!field}]", "brackets}there", ['filt: [tag{!!field}]']);
	// wikitext
	fails("[wiki[transclude {{from here!!C}}]]", "A]]B", ['filt: [wiki[{{!!C}}]]']);
	fails("[wiki[transclude {{from here}}]]", "A}} 'B```\"", ['filt: [wiki[{{}}]]']);
});

it("field failures don't prevent from continuing", function() {
	function fail(filter, toTitle, expected, report, failures) {
		const wiki = new $tw.Wiki();
		wiki.addTiddlers([
			utils.operatorConf('list', 'reference'),
			utils.operatorConf('title'),
			utils.operatorConf('tag')]);
		const options = {from: "from", to: toTitle, wiki: wiki};
		utils.failures.calls.reset();
		testFilter(filter, expected, report, options);
		expect(utils.failures).toHaveBeenCalledTimes(failures);
	};
	utils.spyFailures(spyOn);
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
	     "[tag[from]title[from]tag{1]2}]", ['filt: [tag[]]', 'filt: [[]tag...]', 'filt: [tag{}]'], 1);

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

it("looks to field whitelists for field operators", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.fieldConf('relinktest'));
	wiki.addTiddler(utils.fieldConf('relinkref', 'reference'));

	// IMPLICIT FIELD OPERATORS//
	testFilter("[relinktest[from here]]", true, ['filt: [relinktest[]]'], {wiki: wiki});
	// but it ignores implicit field operators with a suffix
	testFilter("[[from here]] [relinktest:suffix[from here]]",
	           "[[to there]] [relinktest:suffix[from here]]",
	           ['filt'], {wiki: wiki});
	// references work too
	testFilter("[relinkref[from here!!field]]", true, ['filt: [relinkref[!!field]]'], {wiki: wiki});
	// multiple indexes
	testFilter("[relinktest[from here],[from here]]",
	           "[relinktest[to there],[from here]]",
	           ['filt: [relinktest[]]'], {wiki: wiki});

	// EXPLICIT FIELD OPERATORS //
	testFilter("[field:relinktest[from here]]", true, ['filt: [field:relinktest[]]'], {wiki: wiki});
	// but it ignores implicit field operators with a suffix
	testFilter("[[from here]] [field:relinktest:suffix[from here]]",
	           "[[to there]] [field:relinktest:suffix[from here]]",
	           ['filt'], {wiki: wiki});
	// references work too
	testFilter("[field:relinkref[from here!!field]]", true, ['filt: [field:relinkref[!!field]]'], {wiki: wiki});
	// multiple indexes
	testFilter("[field:relinktest[from here],[from here]]",
	           "[field:relinktest[to there],[from here]]",
	           ['filt: [field:relinktest[]]'], {wiki: wiki});

});

it("ignores implicit field whitelist for existing filter ops", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.fieldConf('tags'));
	testFilter("[[from here]] [tags[from here]]", "[[to there]] [tags[from here]]", ['filt'], {wiki: wiki});
	// but when it's explicit, Relink does find it
	testFilter("[field:tags[from here]]", true, ['filt: [field:tags[]]'], {wiki: wiki});
});

it("prefers operator conf to field conf", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.fieldConf('relinktest'));
	wiki.addTiddler(utils.operatorConf('relinktest', 'reference'));
	testFilter("[relinktest[from here!!field]]", true, ['filt: [relinktest[!!field]]'], {wiki: wiki});
});

});
