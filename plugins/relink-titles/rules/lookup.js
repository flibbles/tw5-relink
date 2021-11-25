/*\
caption: {{$:/plugins/flibbles/relink-titles/language/Lookup/Caption}}
description: {{$:/plugins/flibbles/relink-titles/language/Lookup/Description}}
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
var anyMatcher = /\$\((?:\*|currentTiddler)\)\$/g;

exports.report = function(targetTitle, callback, options) {
	var patterns = getPatterns(options.wiki);
	for (var i = 0; i < patterns.length; i++) {
		var pattern = patterns[i];
		var results = match(pattern, targetTitle);
		if (results) {
			if (!pattern.blurb) {
				// We'll only ever need one blurb, so store it
				pattern.blurb = pattern.string.replace(anyMatcher, function(match) {
					if (match === "$(*)$") {
						return "*";
					} else { // must be "$(currentTiddler)$"
						return "...";
					}
				});
			}
			callback(results.title, pattern.blurb);
		}
	}
};

exports.relink = function(targetTitle, fromTitle, toTitle, options) {
	var patterns = getPatterns(options.wiki);
	for (var i = 0; i < patterns.length; i++) {
		var pattern = patterns[i];
		var results = match(pattern, targetTitle, fromTitle);
		if (results) {
			var groupIndex = 0;
			// Make all the correct substitutions to create the new title
			var output = pattern.string.replace(anyMatcher, function(match) {
				groupIndex++;
				if (match === "$(*)$") {
					return results[groupIndex];
				} else { // must be "$(currentTiddler)$"
					return toTitle;
				}
			});
			return {output: output};
		}
	}
	return undefined;
};

function match(pattern, string, matchTitle) {
	var results = pattern.matcher.exec(string);
	if (results) {
		// It superficially matches, but we need to make sure all the right
		// groups match too.
		for (var j = 0; j < pattern.groups.length; j++) {
			var index = pattern.groups[j];
			if (matchTitle === undefined) {
				// It doesn't matter what matchTitle is, as long as all
				// groups match the same thing.
				matchTitle = results[index];
			} else if (results[index] !== matchTitle) {
				return null;
			}
		}
		results.title = matchTitle;
	}
	return results;
};

function getPatterns(wiki) {
	return wiki.getCacheForTiddler(patternTiddler, "relink-titles", function() {
		var text = wiki.getTiddlerText(patternTiddler);
		var matchers = []
		if (text) {
			var array = text.split('\n');
			for (var i = 0; i < array.length; i++) {
				var pattern = formPatternFromString(array[i]);
				if (pattern) {
					matchers.push(pattern);
				}
			}
		}
		return matchers;
	});
};

function formPatternFromString(string) {
	var groupIndex = 1;
	var matchingGroups = [];
	string = $tw.utils.trim(string);
	var parts = string.split("$(currentTiddler)$");
	if (parts.length <= 1) {
		// $(currentTiddler)$ must not have been there
		return null;
	}
	for (var j = 0; j < parts.length; j++) {
		// Split it up by the wildcards
		var sections = parts[j].split("$(*)$");
		for (var k = 0; k < sections.length; k++) {
			sections[k] = $tw.utils.escapeRegExp(sections[k]);
		}
		parts[j] = sections.join("(.*)");
		// If there are 3 sections, then there is 2 $(*)$, so the index
		// must skip them. etc...
		groupIndex += sections.length-1;
		if (j < parts.length-1) {
			// If there are 3 parts, that means 2 $(currentTiddler)$, and
			// so we skip the last part
			matchingGroups.push(groupIndex);
			groupIndex++;
		}
	}
	return {
		string: string,
		groups: matchingGroups,
		matcher: new RegExp("^" + parts.join("(.*)") + "$")
	};
};
