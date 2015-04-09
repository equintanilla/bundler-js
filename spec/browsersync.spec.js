var bundlerFactory = require('../');
var fs = require('fs');
var browserSync = require('browser-sync');


describe("browserSyncTest", function () {
    it("should not get Error", function (done) {

        var finished = 0;
        var fileWritten = false;
        var sourceFolderPath = './spec/fixtures/bundles/browsersync/';
        var dummyFilename = 'dummy.js';
        var dummyPath = sourceFolderPath + dummyFilename;
        this.dummyPath = dummyPath;

        var bundlerConfig = {
            appScript: dummyPath,
            outputFile: 'bundle.js',
            dest: 'output',
            shouldWatchify: true,
            shouldUglify: false,
            shouldWriteSourceMaps: false,
            shouldBrowserSync: true,
            errorHook: function (err) {
                console.log('from errorHook');
                expect(true).toEqual(false);
            },
            finishHook: function () {
                console.log('from finishHook');

                finished++;
                console.log('about to be done');
                if (finished === 1) {
                    swapFileContents();
                }
                if (fileWritten) {
                    expect(finished).toBe(2);
                    done();
                }

            },
            finishStepHook: function () {
                console.log('finishedStepHook');
            }
        };
        var bundler = bundlerFactory(bundlerConfig);

        var self = this;
        var swapFileContents = function () {
            fs.readFile(dummyPath, function (err, data) {
                if (err) throw err;
                self.originalContent = data;
                writeFile();

            });
        };
        var writeFile = function () {
            console.log('writing dummyPath');
            fs.writeFile(dummyPath,"var newFunc = function(){console.log('dummy file changed');}", function (err) {
                if (err) throw err;
                console.log('finished writing file');
                fileWritten = true;

            });
        };


    });

    afterEach(function (done) {
        console.log('original content:\n' + this.originalContent);
        fs.writeFile(this.dummyPath, this.originalContent, function () {
            done();
        });
    })

});