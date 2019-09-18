/*\

Tests the new relinking wiki methods.

\*/

var utils = require("test/utils");
var relink = utils.relink;

describe('relink', function() {

function testConfig(relink, /* tiddler objects */) {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([ {title: "from"}, {title: "test", text: "[[from]]"}]);
	wiki.addTiddlers(Array.prototype.slice.call(arguments, 1));
	utils.collect("log", function() {
		// Just ensuring that this doesn't throw.
		wiki.renameTiddler("from", "to");
	});
	var expected = relink ? "[[to]]": "[[from]]";
	expect(wiki.getTiddler("test").fields.text).toEqual(expected);
};

it("handles getting no configuration at all", function() {
	testConfig(true);
});

it("handles inclusive configuration", function() {
	testConfig(true, utils.toUpdateConf("[all[]]"));
	testConfig(true, utils.toUpdateConf("[tag[update]]"),
		{title: "test", tags: "update", text: "[[from]]"});
});

it("properly ignores tiddlers outside of to-update", function() {
	testConfig(false, utils.toUpdateConf("[tag[update]]"));
});

it("to-update handles non-existent tiddlers", function() {
	testConfig(true, utils.toUpdateConf("test non-existent"));
});

it("handles errors with at least some grace", function() {
	function thrower(exception, expected) {
		var oldParseStringArray = $tw.utils.parseStringArray;
		var wiki = new $tw.Wiki();
		var e;
		wiki.addTiddlers([
			{title: "tiddlertest", test: "A"},
			utils.fieldConf("test", "list")
		]);
		try {
			$tw.utils.parseStringArray = function() {
				throw new Error(exception);
			};
			wiki.renameTiddler("anything","something",{wiki: wiki});
		} catch (thrown) {
			e = thrown;
		} finally {
			$tw.utils.parseStringArray = oldParseStringArray;
		}
		expect(e).toBeDefined();
		expect(e.message).toEqual(expected);
	};
	//thrower("Ping", "Ping\nError relinking 'tiddlertest'");
	thrower('Boom', "Boom\nWhen relinking 'tiddlertest'");
});

it('can filter for all impossible tiddlers', function() {
	function test(filter, expected) {
		var wiki = new $tw.Wiki(), result;
		wiki.addTiddlers(utils.setupTiddlers());
		wiki.addTiddlers([
			{title: "$:/plugins/flibbles/relink/language/Error/RelinkFilterOperator", text: "This text is pulled"},
			{title: "from"},
			{title: "A", list: "from"},
			{title: "B"},
			{title: "C", text: "[[from]]"}
		]);
		var warn = utils.collect("warn", function() {
			var log = utils.collect("log", function() {
				result = wiki.filterTiddlers(filter);
			});
			expect(log).toEqual([]);
		});
		expect(warn).toEqual([]);
		expect(result).toEqual(expected);
	};
	test("'bad]] t' +[relink:impossible[from]]", ["A"]);
	test("[relink:references[from]]", ["A", "C"]);
	test("[relink:nonexistent[]]", ["This text is pulled"]);
});

});

