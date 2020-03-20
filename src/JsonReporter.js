const _ = require('lodash');
const jsonfile = require('jsonfile');
const mkdirp = require('mkdirp');
const path = require('path');
const hat = require('hat');
const fs = require('fs');
const cycle = require('cycle');
const BaseReporter = require('./BaseReporter');

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

class JsonReporter extends BaseReporter {
    constructor(options = {}) {
        super();

        self = this;

        self.started = false;
        self.finished = false;

        self.savePath = options.savePath || '';
        self.fileName = _.isUndefined(options.fileName) ? 'jsonReport' : options.fileName;
        self.consolidate = _.isUndefined(options.consolidate) ? true : options.consolidate;
        self.takeScreenshots = _.isUndefined(options.takeScreenshots) ? true : options.takeScreenShots;
        self.takeScreenshotsOnlyOnFailures = _.isUndefined(options.takeScreenshotsOnlyOnFailures) ? false : options.takeScreenshotsOnlyOnFailures;
        self.screenshotsFolder = (options.screenshotsFolder || 'screenshots').replace(/^\//, '') + '/';
        self.useDotNotation = _.isUndefined(options.useDotNotation) ? true : options.useDotNotation;

        self.currentSuite = null;

        self.results = {
            'runs': {

            }
        };
        
        self.runNumber = 1;
        self.isNewRun = false;
    }

    appendSuite(suite) {
        return self.results.runs[self.runNumber].suites.push(suite);
    }

    getSuites(results = self.results) {
        return results.runs[self.runNumber].suites;
    }

    jasmineStarted() {
        self.started = true;

        if (self.isNewRun) {
            const results = self.readJsonFile(self.getReportFileName('json'));
            
            if (!results) {
                self.runNumber = 1;
            } else {
                const highestNumberedRun = Object.keys(results.runs).reduce((prev, curr) => {
                    return curr > prev ? curr : prev;
                });
                self.runNumber = parseInt(highestNumberedRun) + 1;
            }

            self.isNewRun = false;
        }

        if (!(self.results.runs[self.runNumber])) {
            self.results.runs[self.runNumber] = {
                'suites': []
            }
        }
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
            self.appendSuite(suite);
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

        if (isSkipped(spec)) { spec._suite._skipped++; }
        if (isDisabled(spec)) { spec._suite._disabled++; }
        if (isFailed(spec)) { spec._suite._failures++; }

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

        self.writeOrAppendJsonFile(self.results, self.getReportFileName('json'));

        self.finished = true;
    }

    readJsonFile(fileName = self.fileName) {
        const filePath = path.join(self.savePath, fileName);
        
        try {
            return jsonfile.readFileSync(filePath);
        } catch (error) {
            return null;
        }
    }

    writeOrAppendJsonFile(results, fileName) {
        let savedResults = self.readJsonFile(fileName);

        // recursively create the folder if it doesnt exist.
        mkdirp.sync(self.savePath);
        // get rid of circular references.
        results = cycle.decycle(results);
        const filePath = path.join(self.savePath, fileName);

        try {
            if (!savedResults) {
                return jsonfile.writeFileSync(filePath, results);
            }
            
            if (savedResults.runs[self.runNumber]) {
                // append suites to already saved suites.
                const savedSuites = self.getSuites(savedResults);
                const newSuites = self.getSuites(results);
                savedResults.runs[self.runNumber].suites = savedSuites.concat(newSuites);
            } else {
                // assign to run if run doesnt exist.
                savedResults.runs[self.runNumber] = results.runs[self.runNumber];
            }

            return jsonfile.writeFileSync(filePath, savedResults);
        } catch (e) {
            console.error(
                'Warning: writing json report failed for ' + path + fileName + 'with error' + error
            );
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
