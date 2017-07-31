/**
 * Created by marcelmaas on 10/03/2017.
 */
// file based on example: https://gist.github.com/kataras/b3ee26cc5037bba451b3

var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var typescript = require('gulp-typescript');

var tsProject = typescript.createProject('tsconfig.json',{
  declaration: false
});

gulp.task('backendSrc', function(){
  var tsResult = gulp.src(['src/**/*.ts', 'src/**/**/*.ts']).pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('./dist'))
});

gulp.task('serverAssets', function() {
  return gulp.src('./src/**/*.json','./src/**/**/*.json').pipe(gulp.dest('./dist'));
});

// --- ADDITIONAL-TASKS ---


gulp.task('watch', function(){
  nodemon({
    // the script to run the app
    script: './dist/server.js',
    tasks: ['backendSrc'],
    ext: 'ts json',
    ignore: ['assets/','dist/', 'src/app/']
  }).on('restart', function(){
    console.log("changes found, restarting");
  });
});

gulp.task('build', gulp.series('backendSrc', 'serverAssets'), function(done){});

gulp.task('serve', gulp.series('backendSrc', 'serverAssets', 'watch'), function(done){});
