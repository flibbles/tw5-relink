# Relink

tw5-relink is for automatically updating tiddlers in Tiddlywiki5 when renaming.

By default in TW5, when you rename a tiddler, it gives you the option to
automatically update the `list` and `tags` field of all other tiddlers.

But what about updating a tiddler's text? What about other fields like
`list-before` and `list-after`. What about other fields that are unique to
my project?

This is what relink is for. It expands on TW5's bulk updating to allow for
any customizable fields to be updated, whether they're lists, filters, or
single-tiddler fields. In addition, relink parses through the text of all
relevant tiddlers and updates prettyLinks, transclusions, widgets, and other
syntax patterns to properly reflect the title change.

### Widgets

Widget attributes are updated if they're whitelisted. By default, several
widget attributes are whitelisted, such as `to=` in `<$link>`, but the
defaults can be removed, and custom attributes can be added in relink
configuration, and you can specify whether they'll specify single tiddlers,
lists, or filters (such as `<$list filter=`).

### Filters

Filters in whitelisted fields and attributes are updated as well. However,
only certain operands are evaluated for updating. This too uses a configurable
whitelist. The defaults are `[title[]]` operators (including shorthands such
as `[[Title]]`, `"Title"`, `'Title'`, `Title`, and `[field:title[Title]]`),
and the `[tag[]]` operator. These can be removed, and others can be added
through the relink configuration.

## How to install

### For Node.js

The contents of the `plugins` directory must be copied into the `plugins`
directory in your tiddlywiki installation. This is likely in

`/usr/local/lib/node_modules/tiddlywiki`

If this is the case, you can also run `npm run build` to install.

Afterward, install this plugin into your projects' `tiddlywiki.info` file.
The plugins section will look something like:
```
{
   ...
   "plugins": [
      ...
      "flibbles/relink"
   ],
   ...
}
```

Alternatively, you can also copy the `plugins` directly into your projects'
root directory. Though this makes the install local only to those specific
projects.

## How to test

Testing requires `npm` to be installed, as well as `tiddlywiki` to be installed
and available on the command line (most likely installed using `npm`).

Then run: `npm test`
