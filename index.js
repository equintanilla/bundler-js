var gulp = require('gulp');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var streamify = require("gulp-streamify");

var browserify = require('browserify');
var babelify = require('babelify');

var source = require('vinyl-source-stream');
var watchify = require('watchify');
var gulpif = require('gulp-if');
var lazypipe = require('lazypipe');
var gutil = require('gulp-util');
var prettyTime = require('pretty-hrtime');


var bundle = function (config) {

    var appScript = config.appScript;
    var DestinationFolder = config.dest;
    var babelifiedBrowserified = config.outputFile;
    var errorHook = config.errorHook;
    var finishHook = config.finishHook;
    var finishStepHook = config.finishStepHook;
    var startTime;
    var shouldWatchify = config.shouldWatchify;
    var shouldUglify = config.shouldUglify;
    var shouldWriteSourceMaps = config.shouldWriteSourceMaps;

    var errorFunctionFactory = function (context) {
        return function (err) {
            gutil.log('Error from ', context.pipeStep, ': ', gutil.colors.red(err.message));
            this.emit('end');
        }

    };

    var onFinishFunctionFactory = function (context) {
        return function () {
            var taskTime = process.hrtime(startTime);
            var time = prettyTime(taskTime);
            gutil.log('finished stream', gutil.colors.blue(context.pipeStep) + '.', 'Time elapsed:', gutil.colors.magenta(time));

        };
    };


    var StepNames = {
        BUNDLE: 'bundle',
        SOURCE_BUNDLE: "sourceBundle",
        PROD_TRANSFORMATIONS: 'prodTransformations',
        SOURCEMAPS_INIT: 'sourceMapsInit',
        UGLIFY: 'uglify',
        SOURCEMAPS_WRITE: 'sourceMapsWrite',
        DEST: 'dest'
    };


    var pipeFactory = function (stepName, func) {
        return function () {
            return lazypipe()
                .pipe(func)()
                .on('error', function (err) {
                    if (errorHook) {
                        errorHook(err);
                    }
                })
                .on('error', errorFunctionFactory({pipeStep: stepName}))
                .on('finish',function(){
                    if(finishStepHook){
                        finishStepHook();
                    }
                })

            .on('finish', onFinishFunctionFactory({pipeStep: stepName}));
        }
    };

    function browserifyThis() {

        var browserified = function (filename) {
            var b;
            if (shouldWatchify) {
                gutil.log('watchifying');
                b = watchify(
                    browserify({
                        entries: filename,
                        debug:  true
                        //insertGlobals: true
                    }))
                    .transform(babelify);

                b = b.on('update', bundlingUpdate);

            } else {
                b = browserify({
                    entries: filename,
                    debug:true
                    //insertGlobals: true
                })
                    .transform(babelify);

            }
            return b;
        };

        var bundleFunction = function () {
            return bundler.bundle();
        };

        var sourceBundleFunction = function () {
            return source(babelifiedBrowserified);
        };

        var sourceMapsInitFunction = function () {
            return gulpif(shouldWriteSourceMaps, streamify(sourcemaps.init({loadMaps: true})))
        };

        var uglifyFunction = function () {
            return gulpif(shouldUglify, streamify(uglify({mangle: false})))
        };

        var sourceMapsWriteFunction = function () {
            return gulpif(shouldWriteSourceMaps, streamify(sourcemaps.write('./')));

        };

        var destFunction = function () {
            return gulp.dest(DestinationFolder);
        };


        var bundlePipe = pipeFactory(StepNames.BUNDLE, bundleFunction);

        var sourceBundlePipe = pipeFactory(StepNames.SOURCE_BUNDLE, sourceBundleFunction);

        var sourceMapsInitPipe = pipeFactory(StepNames.SOURCEMAPS_INIT, sourceMapsInitFunction);

        var uglifyPipe = pipeFactory(StepNames.UGLIFY, uglifyFunction);

        var sourceMapsWritePipe = pipeFactory(StepNames.SOURCEMAPS_WRITE, sourceMapsWriteFunction);

        var destPipe = pipeFactory(StepNames.DEST, destFunction);


        var bundling = function () {
            var bundled;
            startTime = process.hrtime();
            gutil.log(gutil.colors.green('Start bundling...'));

            bundled = bundlePipe()
                .pipe(sourceBundlePipe())
                .pipe(sourceMapsInitPipe())
                .pipe(uglifyPipe())
                .pipe(sourceMapsWritePipe())
                .pipe(destPipe())
                .on('finish', function () {
                    if (finishHook) {
                        finishHook();
                    }
                });
            return bundled;
        };

        var bundlingUpdate = function () {
            gutil.log(gutil.colors.yellow('bundling on update'));
            return bundling();
        };

        var bundler = browserified(appScript);

        var returning = bundling();
        return returning;
    }

    return browserifyThis();
};

module.exports = bundle;
