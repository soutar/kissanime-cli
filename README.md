# KissAnime CLI

Quick and dirty command-line interface for streaming anime from KissAnime. The CLI allows you to search by anime title and select any available episode. The episode you select will be opened in your default web browser.

![](http://i.imgur.com/gNZeXYq.gif)

## Build

KissAnime CLI is not yet available via npm, but can be built manually if you have Node.js installed.

* `git clone git@github.com:soutar/kissanime-cli.git`
* `cd kissanime-cli`
* `npm install`
* Finally, run with `node lib/kissanime.js`

## Shout outs

* [Cloudscraper](https://github.com/codemanki/cloudscraper) - Used to get around Cloudflare's DDoS protection. Very handy!
* [Inquirer](https://github.com/SBoudrias/Inquirer.js) - Awesome, friendly command-line UI.
* [KissAnime](http://kissanime.to/) - Somewhat questionable source of great anime
* [Babel](https://github.com/babel/babel) - Allowed me to write crazy lunatic code with async/await. See lines 71-73 in src/kissanime.js for the coolest async-masquerading-as-sync code ever.

## Bugs

There are probably bugs in this. If you're using it and find one, feel free to [open an issue](https://github.com/soutar/kissanime-cli/issues/new) and I'll try and fix it. PRs of any sort are also very welcome.
