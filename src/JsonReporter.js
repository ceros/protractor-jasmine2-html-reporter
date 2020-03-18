const _ = require('lodash');
const jsonfile = require('jsonfile');
const mkdirp = require('mkdirp');
const path = require('path');
const hat = require('hat');
const fs = require('fs');
const cycle = require('cycle');

const fakeFocusedSuite = {
    id: 'focused',
    description: 'focused specs',
    fullName: 'focused specs'
};

let __suites = {}, __specs = {};
function getSuite(suite) {
    __suites[suite.id] = _.extend(__suites[suite.id] || {}, suite);
    return __suites[suite.id];
}

function getSpec(spec) {
    __specs[spec.id] = _.extend(__specs[spec.id] || {}, spec);
    return __specs[spec.id];
}

function isFailed(obj) { return obj.status === 'failed'; }
function isSkipped(obj) { return obj.status === 'pending'; }
function isDisabled(obj) { return obj.status === 'disabled'; }

let self;

class JsonReporter {
    constructor(options = {}) {
        self = this;

        self.started = false;
        self.finished = false;

        self.savePath = options.savePath || '';
        self.fileName = _.isUndefined(options.fileName) ? 'htmlReport' : options.fileName;
        self.consolidate = _.isUndefined(options.consolidate) ? true : options.consolidate;
        self.takeScreenshots = _.isUndefined(options.takeScreenshots) ? true : options.takeScreenShots;
        self.takeScreenshotsOnlyOnFailures = _.isUndefined(options.takeScreenshotsOnlyOnFailures) ? false : options.takeScreenshotsOnlyOnFailures;
        self.screenshotsFolder = (options.screenshotsFolder || 'screenshots').replace(/^\//, '') + '/';
        self.useDotNotation = _.isUndefined(options.useDotNotation) ? true : options.useDotNotation;

        self.suites = [];
        self.currentSuite = null;
    }

    jasmineStarted(summary) {
        self.started = true;
    }

    suiteStarted(suite) {
        suite = getSuite(suite);
        suite._startTime = new Date();
        suite._specs = [];
        suite._suites = [];
        suite._failures = 0;
        suite._skipped = 0;
        suite._disabled = 0;
        suite._parent = self.currentSuite;

        if (!self.currentSuite) {
            self.suites.push(suite);
        } else {
            self.currentSuite._suites.push(suite);
        }

        self.currentSuite = suite;
    }

    specStarted(jasmineSpec) {
        if (!self.currentSuite) {
            self.suiteStarted(fakeFocusedSuite);
        }

        let spec = getSpec(jasmineSpec);
        spec._startTime = new Date();
        spec._suite = self.currentSuite;
        self.currentSuite._specs.push(spec);
    }

    specDone(jasmineSpec) {
        let spec = getSpec(jasmineSpec);
        spec._endTime = new Date();

        if (isSkipped(spec)) { spec._suite._skipped++; };
        if (isDisabled(spec)) { spec._suite._disabled++; };
        if (isFailed(spec)) { spec._suite._failures++; };

        const shouldTakeScreenShot = (self.takeScreenShots && !self.takeScreenshotsOnlyOnFailures)
            || (self.takeScreenShots &&  self.takeScreenshotsOnlyOnFailures && isFailed(spec));

        if (shouldTakeScreenShot) {
            spec.screenshot = hat() + '.png';

            self.takeScreenShot(spec);
        }
    }

    suiteDone(jasmineSuite) {
        let suite = getSuite(jasmineSuite);
        if (_.isUndefined(suite._parent)) {
            self.suiteStarted(suite);
        }
        suite._endTime = new Date();
        self.currentSuite = suite._parent;
        suite.name = self.getFullyQualifiedSuiteName(suite);
    }

    jasmineDone() {
        if(self.currentSuite) {
            self.suiteDone(fakeFocusedSuite);
        }

        self.writeOrAppendJsonFile(self.suites, self.getReportFileName('json'));

        self.finished = true;
    }

    writeOrAppendJsonFile(suites, fileName) {
        mkdirp.sync(self.savePath);

        const content = cycle.decycle(suites);
        const filePath = path.join(self.savePath, fileName);

        try {
            return jsonfile.readFile(filePath, (err, obj) => {
                if (err) {
                    return jsonfile.writeFile(filePath, content);
                }

                let json = obj.concat(content);
                return jsonfile.writeFile(filePath, json);
            });
        } catch (e) {
            console.log('Warning: writing json report failed for ' + path + fileName);
        }
    }

    getFullyQualifiedSuiteName(suite) {
        let suiteName = suite.description;

        if (self.useDotNotation) {
            for (let parent = suite._parent; parent; parent = parent._parent) {
                suiteName = parent.description + '.' + suiteName;
            }
        } else {
            suiteName = suite.fullName;
        }

        return suiteName;
    }

    getReportFileName(format = 'html') {
        let name = self.fileName;

        const fileExt = name.slice(-5);
        if (fileExt === '.html' || fileExt === '.json') {
            return name;
        }

        if (format === 'html') {
            name += '.html';
        } else if (format === 'json') {
            name += '.json';
        }

        return name;
    }

    takeScreenshot(spec) {
        browser.takeScreenshot().then(function (png) {
            const screenshotPath = path.join(self.savePath,  self.screenshotsFolder, spec.screenshot);

            mkdirp(path.dirname(screenshotPath), (err) => {
                if (err) {
                    throw new Error('Could not create directory for ' + screenshotPath);
                }

                const stream = fs.createWriteStream(screenshotPath);
                stream.write(new Buffer(png, 'base64'));
                stream.end();
            });
        });
    }
}

module.exports = JsonReporter;
