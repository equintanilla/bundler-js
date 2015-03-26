var bundlerFactory = require('../..');
var fs = require('fs');


describe(" bundler", function () {
    it("file exists on valid dependencies", function (done) {

        var config = {
            appScript: './test/fixtures/bundles/valid/sample.js',
            outputFile: 'bundle.js',
            dest: 'output',
            shouldWatchify: true,
            shouldUglify: false,
            shouldWriteSourceMaps: true,
            errorHook: function (err) {
                console.log('from errorhook')
                done(err);
            },
            finishHook: function () {
                console.log('from finishhok');

                console.log('last task executed');
                var path = getOutputPath();
                console.log('path:' + path);
                var fileExists = fs.existsSync(path);
                expect(fileExists).toBe(true);
                done(fileExists ? null : 'file does not exist');


            },
            finishStepHook: function () {
                console.log('finishedStepHook');
            }
        };
        var outputPath = './' + config.dest + '/' + config.outputFile;
        var getOutputPath = function () {
            return outputPath;
        };

        var bundler = bundlerFactory(config);


    })

    it("error on invalid dependencies", function (done) {

        var config = {
            appScript: './test/fixtures/bundles/invalid/sample.js',
            outputFile: 'bundle.js',
            dest: 'output',
            shouldWatchify: true,
            shouldUglify: false,
            shouldWriteSourceMaps: true,
            errorHook: function (err) {

                 done();
                console.log('from errorhook')
            },
            finishHook: function () {
                console.log('from finishhok');

                console.log('last task executed');
                var path = getOutputPath();
                console.log('path:' + path);
                var fileExists = fs.existsSync(path);
                expect(fileExists).toBe(true);
                done(fileExists ? null : 'file does not exist');


            },
            finishStepHook: function () {
                console.log('finishedStepHook');
            }
        };
        var outputPath = './' + config.dest + '/' + config.outputFile;
        var getOutputPath = function () {
            return outputPath;
        };

        var bundler = bundlerFactory(config);
        expect(bundler).toThrow();


    })

});

