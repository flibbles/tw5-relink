/*\
caption: <$link>Example Option</$link>
description: This example module. It's a 3rd party option which didn't come with //Relink-titles// that shows how other plugins can add rename rules of their own. See <<link-to-tab Plugins Plugins/Titles "the //Relink-titles// documentation page">> for more information.
module-type: relinktitlesrule
title: Plugins/Titles/example.js
type: application/javascript

This example module relinks tiddler titles which are prefixed versions of a
renamed tiddler. For example...

    If `fromTitle` is renamed to `toTitle`, then this rule renames
    `$:/TitlesExample/fromTitle` to `$:/TitlesExample/toTitle`.

This is just an example, but core Tiddlywiki will often use prefixes like this
to denote settings related to a tiddler, such as the prefix
`$:/config/EditorToolbarButtons/Visibility/` which corresponds to specific
buttons, and contains settings for their visibility.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

// The name is just a name for your rule. Currently this isn't used,
// but you should put something unique anyway.
exports.name = 'example';

/**The report method is for the "//Relink// references" info panel.
 *
 * Given a title, it call the callback method for every tiddler it might be
 * referencing. In this example, that means if the given tiddler has the
 * `$:/TitlesExample/` prefix, it'll return whatever it relates to.
 *
 * title: title of tiddler to consider for references
 * callback: method to call for each reference
 */
exports.report = function(targetTitle, callback, options) {
	// If this title doesn't start with the prefix,
	// then it's irrelevant for this rule.
	if (targetTitle.startsWith('Example/setting/')) {
		var referencedTitle = targetTitle.substr('Example/setting/'.length);
		// First param is the other tiddler that this title references.
		// Second param is optional. It's a blurb describing the relationship.
		callback(referencedTitle, 'Example titles rule');
	}
};

/**Specifies a change for a given title given rename 'fromTitle' to 'toTitle'
 *
 * When 'fromTitle' is renamed to 'toTitle', this method will be called for
 * all tiddlers. For any given tiddler, if this returns a string, that string
 * will replace that tiddler's title.
 *
 * title: title of tiddler to possibly relink
 * fromTitle: old title of tiddler whose rename triggered relinking
 * toTitle: new title of tiddler whose rename triggered relinking
 */
exports.relink = function(targetTitle, fromTitle, toTitle, options) {
	// If this is the TitlesExample tiddler for the renamed tiddler...
	if (targetTitle === ('Example/setting/' + fromTitle)) {
		// Then return the TitlesExample tiddler for the new name.
		return {output: 'Example/setting/' + toTitle};
		// If, for whatever reason, we could NOT change the targetTitle
		// given this particular toTitle, then we would instead return:
		//     {impossible: true};
	}
	// Otherwise, if this targetTitle is irrelevant, do nothing, or return:
	//     undefined
};
