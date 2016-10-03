# protractor-jasmine2-html-reporter
[![npm version](https://badge.fury.io/js/protractor-jasmine2-html-reporter.svg)](http://badge.fury.io/js/protractor-jasmine2-html-reporter)

## Differences in this version
* added `retainScreenshots: true` to retain screenshots on subsequent test runs. Otherwise these get overwritten each run, which isn't great if you want historical reports. 
* added support for [sharded test runs](https://github.com/angular/protractor/blob/master/lib/config.ts). So if you shard your tests, instead of reported after _each file_ (which who wants that?), it will append the result file, instead of overwriting, and thus, have the same behavior for non-sharded tests. Thanks to `aditya reddy` for this!

HTML reporter for Jasmine2 and Protractor that will include screenshots of each test if you want.
This work is inspired by:
* [Protractor Jasmine 2 Screenshot Reporter](https://github.com/mlison/protractor-jasmine2-screenshot-reporter) from [@mslison](https://github.com/mlison)
* [Jasmine Reporters](https://github.com/larrymyers/jasmine-reporters) from [@larrymyers](https://github.com/larrymyers)

## Usage
The <code>protractor-jasmine2-html-reporter</code> is available via npm:

<code>$ npm install protractor-jasmine2-html-reporter --save-dev</code>

In your Protractor configuration file, register protractor-jasmine2-html-reporter in jasmine:

<pre><code>var Jasmine2HtmlReporter = require('protractor-jasmine2-html-reporter');

exports.config = {
   // ...
   onPrepare: function() {
      jasmine.getEnv().addReporter(
        new Jasmine2HtmlReporter({
          savePath: 'target/screenshots'
        })
      );
   }
}</code></pre>

## Options
### Destination folder

Output directory for created files. All screenshots and reports will be stored here.

If the directory doesn't exist, it will be created automatically or otherwise cleaned before running the test suite.

<pre><code>jasmine.getEnv().addReporter(new Jasmine2HtmlReporter({
   savePath: './test/reports/'
}));</code></pre>

Default folder: <code>./</code>

### Screenshots folder (optional)

By default the screenshots are stored in a folder inside the default path

If the directory doesn't exist, it will be created automatically or otherwise cleaned before running the test suite.

<pre><code>jasmine.getEnv().addReporter(new Jasmine2HtmlReporter({
   savePath: './test/reports/',
   screenshotsFolder: 'images'
}));</code></pre>

Default folder: <code>screenshots</code>

### Take screenshots (optional)

When this option is enabled, reporter will create screenshots for specs.

<pre><code>jasmine.getEnv().addReporter(new Jasmine2HtmlReporter({
   takeScreenshots: false
}));</code></pre>

Default is <code>true</code>

### Take screenshots only on failure (optional) - (NEW)

This option allows you to choose if create screenshots always or only when failures.
If you disable screenshots, obviously this option will not be taken into account.

<pre><code>jasmine.getEnv().addReporter(new Jasmine2HtmlReporter({
   takeScreenshots: true,
   takeScreenshotsOnlyOnFailures: true
}));</code></pre>

Default is <code>false</code> (So screenshots are always generated)


### FixedScreenshotName (optional)

Choose between random names and fixed ones.

<pre><code>jasmine.getEnv().addReporter(new Jasmine2HtmlReporter({
   savePath: './test/reports/',
   fixedScreenshotName: true
}));</code></pre>

Default is <code>false</code>


### FilePrefix (optional)

Filename for html report.

<pre><code>jasmine.getEnv().addReporter(new Jasmine2HtmlReporter({
   savePath: './test/reports/',
   filePrefix: 'index'
}));</code></pre>

Default is <code>htmlReport.html</code>

### Consolidate and ConsolidateAll (optional)

This option allow you to create different HTML for each test suite.

<pre><code>jasmine.getEnv().addReporter(new Jasmine2HtmlReporter({
   consolidate: true,
   consolidateAll: true
}));</code></pre>

Default is <code>false</code>

### RetainScreenshots (optional)

This option, if true, will not delete the screenshots before each test run. 

<pre><code>jasmine.getEnv().addReporter(new Jasmine2HtmlReporter({
   savePath: './test/reports/',
   retainScreenshots: true
}));</code></pre>

Default is <code>false</code>