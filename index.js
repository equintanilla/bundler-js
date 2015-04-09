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
var browserSync = require('browser-sync');

var gutil = require('gulp-util');
var prettyTime = require('pretty-hrtime');

var _ = require('underscore');

var defaultConfig = {
    includePolyfill: true,
    shouldWatchify: true,
    shouldUglify: true,
    shouldWriteSourceMaps: true
};

var requiredConfigProperties = {
    appScript: true,
    dest: true,
    outputFile: true
};
var BUNDLER_JS = 'bundler-js';
var DUMMY_STEP = 'dummyStep';

var calculateFinalConfig = function (providedConfig, configErrors) {


    for (var requiredProperty  in requiredConfigProperties) {
        if (providedConfig[requiredProperty] === undefined || providedConfig[requiredProperty] === null) {
            var errorMessage = 'required property:' + requiredProperty + ' was not provided';
            gutil.log(gutil.colors.red(errorMessage));
            configErrors.push(requiredProperty);
        }
    }

    var finalConfig = {};
    _.extend(finalConfig, defaultConfig, providedConfig);


    return finalConfig;
};


var bundle = function (providedConfig) {

    var configErrors = [];

    var config = calculateFinalConfig(providedConfig, configErrors);

    var appScript = config.appScript;
    var DestinationFolder = config.dest;
    var babelifiedBrowserified = config.outputFile;
    var errorHook = config.errorHook;
    var finishHook = config.finishHook;
    var finishStepHook = config.finishStepHook;
    var shouldWatchify = config.shouldWatchify;
    var shouldUglify = config.shouldUglify;
    var shouldWriteSourceMaps = config.shouldWriteSourceMaps;
    var shouldBrowserSync = config.shouldBrowserSync;

    var startTime;


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
        DEST: 'dest',
        BROWSER_SYNC: 'browserSync'
    };

    var addEventHandlersToPipe = function (pipe, errorHandler, finishHandler) {
        var returningPipe = pipe
            .on('error', errorHandler)
            .on('error', function (err) {
                if (errorHook) {
                    errorHook.call(this, err);
                }
            })
            .on('finish', function () {
                if (finishStepHook) {
                    finishStepHook.call(this)
                }
            })
            .on('finish', finishHandler);
        return returningPipe;
    };

    var pipeFactory = function (stepName, func) {
        return function () {
            var pipe = lazypipe()
                .pipe(func)();
            return addEventHandlersToPipe(pipe,
                errorFunctionFactory({pipeStep: stepName}),
                onFinishFunctionFactory({pipeStep: stepName}));

        }
    };

    function browserifyThis() {

        var browserified = function (filename) {
            var b;
            var entries = [filename];

            var browserifyConfig = {
                entries: entries,
                debug: true
                //insertGlobals: true
            };
            if (shouldWatchify) {
                gutil.log('watchifying');
                b = watchify(browserify(browserifyConfig))
                    .transform(babelify);

                b = b.on('update', bundlingUpdate);

            } else {
                b = browserify(browserifyConfig)
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

        var browserSyncFunction = function () {
            return gulpif(shouldBrowserSync, browserSync.reload({
                stream: true
            }));
        };

        var bundlePipe = pipeFactory(BUNDLER_JS + ':' + StepNames.BUNDLE, bundleFunction);

        var sourceBundlePipe = pipeFactory(BUNDLER_JS + ':' + StepNames.SOURCE_BUNDLE, sourceBundleFunction);

        var sourceMapsInitPipe = pipeFactory(BUNDLER_JS + ':' + StepNames.SOURCEMAPS_INIT, sourceMapsInitFunction);

        var uglifyPipe = pipeFactory(BUNDLER_JS + ':' + StepNames.UGLIFY, uglifyFunction);

        var sourceMapsWritePipe = pipeFactory(BUNDLER_JS + ':' + StepNames.SOURCEMAPS_WRITE, sourceMapsWriteFunction);

        var destPipe = pipeFactory(BUNDLER_JS + ':' + StepNames.DEST, destFunction);

        var browserSyncPipe = pipeFactory(BUNDLER_JS + ':' + StepNames.BROWSER_SYNC, browserSyncFunction);


        var bundling = function () {
            var bundled;
            startTime = process.hrtime();
            gutil.log(gutil.colors.green('Start bundling...'));


            if (configErrors.length > 0) {
                gutil.log(gutil.colors.red('config file reqs missing!'));
                gutil.log(gutil.colors.red(configErrors));

                var errorConfigPipe = pipeFactory(DUMMY_STEP, function () {
                    return gutil.noop();
                });

                bundled = errorConfigPipe();


            } else {
                bundled = bundlePipe()
                    .pipe(sourceBundlePipe())
                    .pipe(sourceMapsInitPipe())
                    .pipe(uglifyPipe())
                    .pipe(sourceMapsWritePipe())
                    .pipe(destPipe())
                    .pipe(browserSyncPipe())


            }
            bundled = bundled.on('finish', function () {
                if (finishHook) {
                    finishHook.call(this);
                }
            });
            if (configErrors.length > 0) {
                bundled.emit('error', new Error('required config args not provided'));
                bundled.emit('finish');
            }
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
