class BaseReporter {
    constructor() { }

    getReportFileName(format = 'html') {
        let name = this.fileName;

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
}

module.exports = BaseReporter;
