var bundlerFactory = require('../..');
var fs = require('fs');


describe("bundler", function () {

    it("file exists on valid dependencies", function (done) {
        console.log('start valid');
        var config = {
            appScript: './test/fixtures/bundles/valid/sample.js',
            outputFile: 'bundle.js',
            dest: 'output',
            shouldWatchify: true,
            shouldUglify: false,
            shouldWriteSourceMaps: true,
            includePolyfill: true,
            errorHook: function (err) {
                console.log('from errorHook');
                done(err);
            },
            finishHook: function () {
                console.log('from finishHook');

                console.log('last task executed');
                var path = getOutputPath();
                console.log('path:' + path);
                var fileExists = fs.existsSync(path);
                expect(fileExists).toBe(true);

                console.log('about to be done');
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


    });

    it("error on invalid dependencies", function (done) {
        console.log('start invalid');

        var config = {
            appScript: './test/fixtures/bundles/invalid/sample.js',
            outputFile: 'bundle.js',
            dest: 'output',
            shouldWatchify: true,
            shouldUglify: false,
            shouldWriteSourceMaps: true,
            includePolyfill: true,
            errorHook: function (err) {
                var errorMessageRegex = /Cannot find module.*\.\/services\/invalid-service/;

                expect(err.message).toMatch(errorMessageRegex);
                console.log('about to be done');
                done(errorMessageRegex.test(err.message) ? null : err);
            },
            finishHook: function () {
                console.log('final finish hook');

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


    });

    it("should fail on required config missing", function (done) {
        var gotError = false;
        var config = {
            errorHook: function (err) {
                console.log('error from throw');
                console.log(err.message);
                expect(err.message).toMatch('required config args not provided');

                console.log('about to be done');
                gotError = true;

            },
            finishHook: function () {
                console.log('finish from throw');

                done(gotError ? null : 'should have not finished');
            },

            finishStepHook: function () {

                console.log('finished step:throw');
            }
        };
        var bundler = bundlerFactory(config);


    });

    it('close bundler', function (done) {
            var config = {
                appScript: './test/fixtures/bundles/dummy/dummy.js',
                outputFile: 'bundle.js',
                dest: 'output',
                shouldWatchify: false,
                shouldUglify: false,
                shouldWriteSourceMaps: false,
                includePolyfill: false,
                finishHook: function () {
                    setTimeout(function() {
                        console.log('killing watches from watchify');
                        bundler.close();

                    },2000);
                    done()

                }

            };
            var bundler = bundlerFactory(config);

        }
    );


});

