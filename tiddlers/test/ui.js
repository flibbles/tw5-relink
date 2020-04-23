/*\

Tests the configuration pages. It only does rudimentary tests, and it's still
important to manually test these config pages. But at least these will catch
easy problems.

\*/

var utils = require("test/utils");

function uiWiki() {
	var wiki = new $tw.Wiki();
	$tw.wiki.eachShadow(function(shadow, title) {
		if (title.startsWith("$:/plugins/flibbles/relink/ui/")) {
			wiki.addTiddler(shadow);
		}
	});
	return wiki;
};

function occurrences(string, segment) {
	var index = 0,
		count = 0;
	while ((index = string.indexOf(segment, index)) >= 0) {
		index++;
		count++;
	}
	return count;
};

describe('ui', function() {

it('displays whitelisted macro settings', function() {
	var wiki = uiWiki();new $tw.Wiki();
	wiki.addTiddler(utils.macroConf("GLOBALMACRO", "GLOBALPARAM"));
	var text = wiki.renderTiddler("text/plain", "$:/plugins/flibbles/relink/ui/configuration/Macros");
	expect(occurrences(text, "GLOBALMACRO")).toBe(1);
	expect(occurrences(text, "GLOBALPARAM")).toBe(1);
});

it('displays inline macro settings', function() {
	var wiki = uiWiki();new $tw.Wiki();
	wiki.addTiddler({title: "macro tiddler", text: "\\relink INLINEMACRO INLINEPARAM:wikitext", tags: "$:/tags/Macro"});
	var text = wiki.renderTiddler("text/plain", "$:/plugins/flibbles/relink/ui/configuration/Macros");
	expect(occurrences(text, "INLINEMACRO")).toBe(1);
	expect(occurrences(text, "INLINEPARAM")).toBe(1);
	expect(occurrences(text, "wikitext")).toBe(1);
});

});
