// We first install all the gulp modules
// $npm install --save-dev browser-sync
var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var eslint = require('gulp-eslint');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('default',['copy-html','sass','scripts'], function(){
    gulp.watch('src/index.html', ['copy-html']);
    gulp.watch('src/scss/**/*.scss',['sass']);
    gulp.watch('src/js/**/*.js',['scripts']);
    // gulp.watch('dist/index.html').on('change', browserSync.reload);

    browserSync.init({
        server: {
            baseDir: ['./dist','.']
        }
    });
});

// We copy the html
gulp.task('copy-html', function(){
    gulp.src('src/*.html')
    .pipe(gulp.dest('./dist'))
    .pipe(browserSync.stream());
});

// We create a SASS task
gulp.task('sass', function(){
    gulp.src('src/scss/**/*.scss')
    .pipe(sourcemaps.init()) // We initialize sourcemaps
    .pipe(sass({
        outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(autoprefixer({
        browsers: ['last 2 versions']
    }))
    .pipe(sourcemaps.write()) // We write sourcemaps
    .pipe(gulp.dest('src/css'))
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.stream());
});

// We concatenate all js in development

gulp.task('scripts', function(){
    gulp.src('src/js/*.js')
    .pipe(sourcemaps.init())
    .pipe(concat('all.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/js/'))
    .pipe(browserSync.stream());
});

// We concatenate and minify all js for production

gulp.task('scripts-prod', function(){
    gulp.src('src/js/*.js')
    .pipe(concat('all.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js/'));
});

// Set up eslint
gulp.task('lint', function(){
    return gulp.src(['src/js/**/*.js'])
    // eslint() attaches the lint output to the eslint property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failOnError last.
    .pipe(eslint.failOnError());
});

// Browser-sync server
// gulp.task('serve', function() {
//     browserSync.init({
//         server: {
//             baseDir: './src'
//         }
//     });
//     gulp.watch('src/scss/**/*.scss',['sass']);
//     gulp.watch('src/*.html').on('change',browserSync.reload);
// });