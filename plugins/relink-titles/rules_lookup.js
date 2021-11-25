/*\
caption: Lookup tiddlers
description: {{$:/plugins/flibbles/relink-titles/lookup/description}}
module-type: relinktitlesrule
title: $:/plugins/flibbles/relink-titles/rules/lookup
type: application/javascript

Handles setting tiddlers which are derived from other tiddlers, like how

```
$:/config/PageControlButtons/Visibility/$(currentTiddler)$
```

set the visibility for $(currentTiddler)$

\*/

"use strict";

exports.name = 'lookup';

var patternTiddler = "$:/config/flibbles/relink-titles/lookup/patterns";
var currentTidMatcher = /\$\(currentTiddler\)\$/g;

exports.report = function(targetTitle, callback, options) {
	var patterns = getPatterns(options.wiki);
	for (var i = 0; i < patterns.length; i++) {
		var pattern = patterns[i];
		var results = pattern.matcher.exec(targetTitle);
		if (results) {
			if (!pattern.blurb) {
				// We'll only ever need one blurb, so store it
				pattern.blurb = pattern.string.replace(currentTidMatcher, "...");
			}
			callback(results[1], pattern.blurb);
		}
	}
};

exports.relink = function(targetTitle, fromTitle, toTitle, options) {
	var patterns = getPatterns(options.wiki);
	for (var i = 0; i < patterns.length; i++) {
		var pattern = patterns[i];
		var results = pattern.matcher.exec(targetTitle);
		if (results && results[1] === fromTitle) {
			var output = pattern.string.replace(currentTidMatcher, toTitle);
			return {output: output};
		}
	}
	return undefined;
};

function getPatterns(wiki) {
	return wiki.getCacheForTiddler(patternTiddler, "relink-titles", function() {
		var text = wiki.getTiddlerText(patternTiddler);
		var matchers = []
		if (text) {
			var array = text.split('\n');
			for (var i = 0; i < array.length; i++) {
				var pattern = $tw.utils.trim(array[i]);
				var parts = pattern.split("$(currentTiddler)$");
				if (parts.length <= 1) {
					// $(currentTiddler)$ must not have been there
					continue;
				}
				for (var j = 0; j < parts.length; j++) {
					parts[j] = $tw.utils.escapeRegExp(parts[j]);
				}
				matchers.push({
					string: pattern,
					matcher: new RegExp("^" + parts.join("(.*)") + "$")
				});
			}
		}
		return matchers;
	});
};
