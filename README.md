# Relink

By default in Tiddlywiki5, when you rename a tiddler, it gives you the option to
automatically update the `list` and `tags` field of all other tiddlers.

But what about updating a tiddler's text? What about other fields like
`list-before` and `list-after`. What about other fields that are unique to
my project?

...What about *markdown*?

This is what Relink is for. It expands on TW5's bulk updating to allow for
any customizable fields to be updated, whether they're lists, filters, macros,
or single-tiddler fields. In addition, relink parses through the text of all
relevant tiddlers and updates prettyLinks, transclusions, widgets, and other
syntax patterns to properly reflect the title change. All of this is fully
customizable.

For a demonstration, and for documentation, see the [tiddlywiki demo site](https://flibbles.github.io/tw5-relink/).

_Quick note_: Relink doesn't support NodeJS tiddlywikis that lazy load. [See the documentation for more details](https://flibbles.github.io/tw5-relink/#Lazy%20Loading).

## How to install

Visit the [demo site](https://flibbles.github.io/tw5-relink/). It will have a little thingy you can drag onto your tiddlywiki project. (The demo site will explain it better.)

It will also have instructions for how to install any Relink supplemental plugins, like markdown support.

### For Node.js

The following is an abridged version of the [instructions found here](https://tiddlywiki.com/#Installing%20custom%20plugins%20on%20Node.js).

First, check out the source code using git. Then copy the contents of the `plugins` directory into a "flibbles" directory in a path where you'd like it to be available. Then add that path to the TIDDLYWIKI_PLUGIN_PATH environment variable.

For instance, copy the contents of the plugin directory to "~/.tiddlywiki/flibbles" directory. Then run `echo "TIDDLYWIKI_PLUGIN_PATH=~/.tiddlywiki" >> .profile`

If you've installed it correctly, the path to the `plugin.info` file should look something like:

`~/.tiddlywiki/flibbles/relink/plugin.info`

Same goes for any supplimental plugins you want, like *relink-markdown*.

Afterward, add the plugin inside your projects' `tiddlywiki.info` file.
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

Make sure you have `tiddlywiki` available on your PATH. Then from the project root directory, type:

`tiddlywiki --build test`

Don't worry about its mention of not finding the [flibbles/uglify](https://github.com/flibbles/tw5-uglify) plugin.

If you're using TiddlyWiki v5.2.3 or earlier (or you get an "Error: Unkown command: test" warning"), the command you type is just:

`tiddlywiki`
