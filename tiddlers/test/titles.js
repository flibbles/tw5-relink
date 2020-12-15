/*\

Tests relinking titles of other tiddlers.

\*/

var utils = require("test/utils");


function test(target, expected, options) {
	var text = target;
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var failCount = options.fails || 0;
	options.target = target
	var results = utils.relink({text: text}, options);
	var changed = options.wiki.getTiddler(expected);
	expect(changed).withContext("Expected tiddler '"+expected+"' to exist").not.toBeUndefined();
	expect(changed.fields.text).toBe(target); // the text should be the old target name
	expect(changed.fields.title).toEqual(expected);
	if (expected !== target) {
		expect(options.wiki.getTiddler(target)).toBeUndefined();
	}
	expect(results.fails.length).toEqual(failCount, "Incorrect number of failures");
	return results;
};

function customTiddler(filter) {
	return {title: "$:/config/flibbles/relink-titles/custom", text: filter};
};

function installedTiddler(title, filter, otherAttributes) {
	return Object.assign({
		title: title,
		filter: filter,
		tags: "$:/tags/flibbles/relink-titles/Filter"}, otherAttributes);
};

function disabler(title, value) {
	if (value === undefined) {
		value = "disabled";
	}
	return {title: "$:/config/flibbles/relink-titles/disabled/" + title, text: value};
};

describe("titles", function() {

it("works at all", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(customTiddler("[removesuffix<fromTiddler>match[$:/prefix/]addsuffix<toTiddler>]"));
	test("$:/prefix/from here", "$:/prefix/to there", {wiki: wiki});
});

it("ignores unrelated tiddlers", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(customTiddler("[removesuffix<fromTiddler>match[$:/prefix/]addsuffix<toTiddler>]"));
	test("$:/prefix/nothing", "$:/prefix/nothing", {wiki: wiki});
});

it("only takes first result from tiddler", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(customTiddler("[removesuffix<fromTiddler>match[$:/prefix/]addsuffix<toTiddler>] [removesuffix<fromTiddler>addsuffix[bad]]"));
	test("$:/prefix/from here", "$:/prefix/to there", {wiki: wiki});
});

it("processes installed filters in tag order", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		installedTiddler("A", "[removeprefix<fromTiddler>addprefix<toTiddler>addsuffix[-A]]", {"list-after": "B"}),
		installedTiddler("B", "[removeprefix<fromTiddler>addprefix<toTiddler>addsuffix[-B]]")]);
	test("from here/test", "to there/test-B", {wiki: wiki});
});

it("custom filters applies last", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		installedTiddler("A", "[removeprefix<fromTiddler>addprefix<toTiddler>addsuffix[-A]]"),
		customTiddler("[removeprefix<fromTiddler>addprefix<toTiddler>addsuffix[-custom]]")]);
	test("from here/test", "to there/test-A", {wiki: wiki});
});

it("can disable installed filters", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		installedTiddler("A", "[removeprefix<fromTiddler>addprefix<toTiddler>addsuffix[-A]]"),
		installedTiddler("B", "[removeprefix<fromTiddler>addprefix<toTiddler>addsuffix[-B]]", {"list-after": "A"}),
		disabler("A")]);
	test("from here/test", "to there/test-B", {wiki: wiki});
});

it("can have inactive disabler tiddlers", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		installedTiddler("A", "[removeprefix<fromTiddler>addprefix<toTiddler>addsuffix[-A]]"),
		installedTiddler("B", "[removeprefix<fromTiddler>addprefix<toTiddler>addsuffix[-B]]", {"list-after": "A"}),
		disabler("A", "enabled")]);
	test("from here/test", "to there/test-A", {wiki: wiki});
});

it("can have empty disabler tiddlers", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		installedTiddler("A", "[removeprefix<fromTiddler>addprefix<toTiddler>addsuffix[-A]]"),
		installedTiddler("B", "[removeprefix<fromTiddler>addprefix<toTiddler>addsuffix[-B]]", {"list-after": "A"}),
		disabler("A", "")]);
	test("from here/test", "to there/test-A", {wiki: wiki});
});

it("doesn't infinitely loop over tiddlers", function() {
	var wiki = new $tw.Wiki();
	// The resulting tiddler from this would be applicable for renaming,
	// thus it might rename ad-infinitum if it doesn't check itself.
	wiki.addTiddler(customTiddler("[prefix<fromTiddler>addsuffix[-changed]]"));
	test("from here/sub", "from here/sub-changed", {wiki: wiki});
});

it("doesn't wipe the content of changed tiddler", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		customTiddler("[removeprefix<fromTiddler>prefix[/]addprefix<toTiddler>]"),
		{title: "from here/path"}]);
	test("from here/path/end", "to there/path/end", {wiki: wiki});

	// Now we do it again, but manually calling relink without options, because
	// it's the options field where we cache the info to not clobber tiddlers.
	wiki = new $tw.Wiki();
	wiki.addTiddlers([
		customTiddler("[removeprefix<fromTiddler>prefix[/]addprefix<toTiddler>]"),
		{title: "from here"},
		{title: "from here/path"},
		{title: "from here/path/end", text: "Not clobbered"}]);
	wiki.relinkTiddler("from here", "to there");
	expect(wiki.getTiddler("to there/path/end").fields.text).toBe("Not clobbered");
});

it("doesn't clobber existing tiddlers", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		customTiddler("[match[A]addsuffix[B]]"),
		{title: "A"},
		{title: "AB", text: "original text"}]);
	var r = test("A", "A", {wiki: wiki, fails: 1});
	expect(r.wiki.getTiddler("AB").fields.text).toBe("original text");
});

it("doesn't rename two tiddlers to the same thing", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		customTiddler("[prefix<fromTiddler>then[pidgeonhole]]"),
		{title: "from here/A", text: "I was A"}]);
	var r = test("from here/B", "from here/B", {wiki: wiki, fails: 1});
	expect(r.wiki.getTiddler("pidgeonhole").fields.text).toBe("I was A");
});

it("doesn't make same-name changes during live relinking", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(customTiddler("[prefix<fromTiddler>]"));
	var r = test("from here/test", "from here/test", {wiki: wiki});
});

it("reports", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		customTiddler("[removeprefix<fromTiddler>addprefix<toTiddler>addsuffix[-changed]]"),
		{title: "from/target"},
		{title: "from"}]);
	var output = wiki.filterTiddlers("[[from/target]relink:report[from]]");
	expect(output).toEqual(["title: from/target-changed"]);
});

it("reports for dry-run", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		customTiddler("[prefix<fromTiddler>]"),
		{title: "from/target"},
		{title: "from"}]);
	var output = wiki.filterTiddlers("[[from/target]relink:report[from]]");
	expect(output).toEqual(["title: from/target"]);
});

it("reports for dry-run: bad pidgeon-holing", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		customTiddler("[prefix<fromTiddler>then[pidgeonhole]]"),
		{title: "from/A"},
		{title: "from/B"},
		{title: "from/C"},
		{title: "from"}]);
	var output = wiki.filterTiddlers("[enlist[from/A from/B from/C]relink:report[from]]");
	expect(output).toEqual(["title: pidgeonhole", "title: pidgeonhole", "title: pidgeonhole"]);
});

it("tries not to let you rename every single tiddler", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(customTiddler("[[Agent Smith]]"));
	test("bystander", "bystander", {wiki: wiki});
});

it("handles malformed custom filters gracefully", function() {
	var wiki = new $tw.Wiki();
	// It's missing its closing bracket
	wiki.addTiddler(customTiddler("[removeprefix<fromTiddler>addprefix<toTiddler>"));
	test("from here/test", "from here/test", {wiki: wiki});
});

});
