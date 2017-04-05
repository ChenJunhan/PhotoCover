const args = require('yargs').argv
const del = require('del')
const gulp = require('gulp')
const $ = require('gulp-load-plugins')()
const browserSync = require('browser-sync').create()
const reload = browserSync.reload

let useSourceMaps = true
let isProduction = !!args.prod

if (isProduction) {
  useSourceMaps = false
}

let handleError = function(err) {
  console.log(err.toString())
  this.emit('end')
}

const paths = {
  app: 'lib/',
  dist: 'dist/',
  scripts: '',
  demo: 'demo/'
}

const source = {
  scripts: {
    src: paths.app + paths.scripts + '*',
    watch: paths.app + paths.scripts + '*'
  }
}

const build = {
  scripts: {
    dist: paths.dist,
    demo: paths.demo
  }
}

gulp.task('watch', () => {
  gulp.watch(source.scripts.watch, ['scripts:demo'])
})

gulp.task('scripts', () => {
  return gulp.src(source.scripts.src)
    .gulp.dest(build.scripts.dist)
    .gulp.dest(build.scripts.demo)
})

gulp.task('scripts:demo', () => {
  return gulp.src(source.scripts.src)
    .pipe($.if(useSourceMaps, $.sourcemaps.init()))
    .pipe($.babel({
      presets: ['es2015']
    }).on('error', handleError))
    .pipe($.if(useSourceMaps, $.sourcemaps.write()))
    .pipe(gulp.dest(build.scripts.demo))
    .pipe($.if(isProduction, reload({
      stream: true
    })))
})

gulp.task('browser-sync', () => {
  browserSync.init({
    server: {
      baseDir: './demo/'
    }
  })
})

gulp.task('demo', [
  'scripts:demo',
  'watch',
  'browser-sync'
])
