/*\

Tests the types filter.

[relink:types[]]

\*/

function test(wiki, defaultType) {
	if (defaultType) {
		var title = "$:/config/flibbles/relink/settings/default-type";
		wiki.addTiddler({title: title, text: defaultType});
	}
	return wiki.filterTiddlers("[relink:types[]]");
};

function assertOrder(list) {
	var error;
	for (var i = 2; i < list.length; i++) {
		if (list[i] < list[i-1]) {
			error = "Invalid order: "+list[i]+" should come before "+list[i-1];
			break;
		}
	}
	expect(error).toBeUndefined();
};

describe('filter: types', function() {

it('works at all', function() {
	var wiki = new $tw.Wiki();
	var types = test(wiki);
	expect(types).toContain("filter");
	expect(types).toContain("list");
	expect(types).toContain("reference");
	expect(types).toContain("title");
	expect(types).toContain("wikitext");
	// This is the imported type as part of the testing framework
	expect(types).toContain("dummy-type");
	assertOrder(types);
});

it('moves default to top', function() {
	var wiki = new $tw.Wiki();
	var types = test(wiki, "title");
	expect(types[0]).toBe("title");

	// use the same wiki. Make sure it updates
	types = test(wiki, "reference");
	expect(types[0]).toBe("reference");
	assertOrder(types);
});

it('imported types can be the default types', function() {
	var wiki = new $tw.Wiki();
	types = test(wiki, "dummy-type");
	expect(types[0]).toBe("dummy-type");
	assertOrder(types);
});

it('if default is configured incorrectly, defaults to title', function() {
	var wiki = new $tw.Wiki();
	types = test(wiki, "nonexistent");
	expect(types[0]).toBe("title");
	assertOrder(types);
});

it('if default is legacy type, properly resolves', function() {
	var wiki = new $tw.Wiki();
	types = test(wiki, "old-dummy-type");
	expect(types[0]).toBe("dummy-type");
	assertOrder(types);
});

it("legacy types shouldn't appear", function() {
	var wiki = new $tw.Wiki();
	var types = test(wiki);
	expect(types.indexOf("field")).toBe(-1);
	expect(types.indexOf("yes")).toBe(-1);
});

});
