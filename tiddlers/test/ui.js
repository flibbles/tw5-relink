/*\

Tests the configuration pages. It only does rudimentary tests, and it's still
important to manually test these config pages. But at least these will catch
easy problems.

\*/

var utils = require("test/utils");

describe('ui', function() {

it('displays macro settings', function() {
	var wiki = new $tw.Wiki();
	$tw.wiki.eachShadow(function(shadow, title) {
		if (title.startsWith("$:/plugins/flibbles/relink/ui/")) {
			wiki.addTiddler(shadow);
		}
	});
	wiki.addTiddler(utils.macroConf("GLOBALMACRO", "GLOBALPARAM"));
	wiki.addTiddler({title: "macros", text: "\\relink INLINEMACRO INLINEPARAM", tags: "$:/tags/Macro"});
	var text = wiki.renderTiddler("text/plain", "$:/plugins/flibbles/relink/ui/configuration/Macros");
	expect(text).toContain("GLOBALMACRO");
	expect(text).toContain("GLOBALPARAM");
	//expect(text).toContain("INLINEMACRO");
	//expect(text).toContain("INLINEPARAM");
});

});
