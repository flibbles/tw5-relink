/*\

Tests the configuration pages. It only does rudimentary tests, and it's still
important to manually test these config pages. But at least these will catch
easy problems.

\*/

var utils = require("./utils");

function uiWiki() {
	var wiki = new $tw.Wiki();
	$tw.wiki.eachShadow(function(shadow, title) {
		if (title.startsWith("$:/plugins/flibbles/relink/ui/")) {
			wiki.addTiddler(shadow);
		}
	});
	return wiki;
};

function assertOccurrences(string, segment, expectedCount) {
	var index = 0,
		count = 0;
	while ((index = string.indexOf(segment, index)) >= 0) {
		index++;
		count++;
	}
	expect(count).toBe(expectedCount, "'"+segment+"' occurred the incorrect number of times");
};

describe('ui', function() {

it('displays whitelisted macro settings', function() {
	var wiki = uiWiki();
	wiki.addTiddler(utils.macroConf("GLOBALMACRO", "GLOBALPARAM"));
	var text = wiki.renderTiddler("text/plain", "$:/plugins/flibbles/relink/ui/configuration/Macros");
	assertOccurrences(text, "GLOBALMACRO", 1);
	assertOccurrences(text, "GLOBALPARAM", 1);
});

it('displays inline macro settings', function() {
	var wiki = uiWiki();
	wiki.addTiddler({title: "macro tiddler", text: "\\relink INLINEMACRO INLINEPARAM:wikitext", tags: "$:/tags/Macro"});
	var text = wiki.renderTiddler("text/plain", "$:/plugins/flibbles/relink/ui/configuration/Macros");
	assertOccurrences(text, "INLINEMACRO", 1);
	assertOccurrences(text, "INLINEPARAM", 1);
	assertOccurrences(text, "wikitext", 1);
});

it('displays <$option> list with all types', function() {
	var wiki = uiWiki();
	wiki.addTiddler(utils.fieldConf("TESTFIELD"));
	var text = wiki.renderTiddler("text/plain", "$:/plugins/flibbles/relink/ui/configuration/Fields");
	assertOccurrences(text, "wikitext", 1);
	assertOccurrences(text, "dummy-type", 1);
});

it('displays plugin subtitle when plugin configuration present', function() {
	var wiki = uiWiki();
	utils.addPlugin("SuperPlugin", [
		utils.fieldConf("anything"),
		utils.fieldConf("second field")], {description: "SuperPlugin Here", wiki: wiki});
	var text = wiki.renderTiddler("text/plain", "$:/plugins/flibbles/relink/ui/configuration/Fields");
	assertOccurrences(text, "SuperPlugin Here", 1);
	assertOccurrences(text, "second field", 1);
});

});
