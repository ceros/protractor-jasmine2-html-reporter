const _ = require('lodash');
const jsonfile = require('jsonfile');
const path = require('path');
const BaseReporter = require('./BaseReporter');

let self;

class HtmlReporter extends BaseReporter {
    constructor(options) {
        super();

        self = this;

        self.showPassed = _.isUndefined(options.showPassed) ? true : options.showPassed;
        self.fileName = options.fileName || 'htmlReport';
        self.savePath = options.savePath || '';
        self.cleanDestination = _.isUndefined(options.cleanDestination) ? false : options.cleanDestination;
        self.showReruns = _.isUndefined(options.showReruns) ? true : options.showReruns;
        
        self.suites = {};
    }

    generateReport() {
        let suites = self.fetchSuites();

        console.log(suites);
    }

    fetchSuites() {
        const jsonReport = self.readJsonReport(this.getReportFileName('json'));

        console.log('json report', jsonReport);

        // if (!self.showPassed && self.showReruns) {
        //     return self.fetchFailedSuiteWithReruns(jsonReport);
        // }
        // else if (!self.showPassed && !self.showReruns) {
        //     return self.fetchFailedSuites(jsonReport);
        // } else {
        //     return self.fetchAllSuites(jsonReport);
        // }
    }

    fetchFailedSuiteWithReruns(suites) {        
        for (let suite of suites) {
            if (suite.failures === 0) {
                continue;
            }

            if (self.suites[suite.name] && self.suites[suite.name].length > 0) {
                self.suites[suite.name].push(suite);
            } else {
                self.suites[suite.name] = [suite];
            }

            if (suite._suites && suite._suites.length > 0) {
                self.fetchFailedSuiteWithReruns(suite._suites);
            }
        }
    }

    // fetchAllSuites(jsonReport) {
    //     let run = 1;
    // }

    // fetchFailedSuites(jsonReport) {
    //     let run = 1;
    // }

    readJsonReport(fileName) {
        const filePath = path.join(self.savePath, fileName);
        try {
            return jsonfile.readFileSync(filePath)
        } catch(e) {
            console.error('Failed: could not read json report file at ' + filePath);
            return [];
        }
    }
}

module.exports = HtmlReporter;
