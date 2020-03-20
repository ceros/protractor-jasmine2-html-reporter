const JsonReporter = require('./src/JsonReporter');
const HtmlReporter = require('./src/HtmlReporter');

class Reporter {
    constructor (options) {
        this.jsonReporter = new JsonReporter(options);
        this.htmlReporter = new HtmlReporter(options);
    }

    beforeLaunch(callback) {
        this.jsonReporter.isNewRun = true;
        callback();
    }

    setFileName(fileName) {
        this.jsonReporter.fileName = fileName;
        this.htmlReporter.fileName = fileName;
    }

    jasmineStarted(summary) {
        this.jsonReporter.jasmineStarted(summary);
    }

    suiteStarted(suite) {
        this.jsonReporter.suiteStarted(suite);
    }

    specStarted(spec) {
        this.jsonReporter.specStarted(spec);
    }

    specDone(spec) {
        this.jsonReporter.specDone(spec);
    }

    suiteDone(suite) {
        this.jsonReporter.suiteDone(suite);
    }

    jasmineDone() {
        this.jsonReporter.jasmineDone();
    }

    afterLaunch(callback) {
        this.htmlReporter.generateReport();
        callback();
    }
}

module.exports = Reporter;
