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

// let handleErr = function(err) {
//   console.log(err.toString())
//   this.emit('end')
// }

const paths = {
  app: 'lib/',
  dist: 'dist/',
  scripts: 'js/',
  less: 'less/',
  css: 'css/',
  demo: 'demo/photoshop/'
}

const source = {
  scripts: {
    src: paths.app + '*',
    watch: paths.app + '*',
    demo: paths.demo + paths.scripts + '*'
  },
  styles: {
    demo: paths.demo + paths.less + '*'
  },
  html: {
    demo: [paths.demo + 'index.html']
  }
}

const build = {
  scripts: {
    dist: paths.dist,
    demo: paths.demo + paths.scripts
  },
  styles: {
    demo: paths.demo + paths.css
  }
}


let handleErr = (err) => {
  console.log(err.toString())
  this.emit('end')
}

gulp.task('watch', () => {
  gulp.watch(source.html.demo).on('change', reload)
  gulp.watch(source.scripts.watch, ['scripts:demo'])
  gulp.watch(source.styles.demo, ['styles:demo'])
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
    }).on('error', handleErr))
    .pipe($.if(useSourceMaps, $.sourcemaps.write()))
    .pipe(gulp.dest(build.scripts.demo))
    .pipe($.if(isProduction, reload({
      stream: true
    })))
})


gulp.task('styles:demo', () => {
  return gulp.src(source.styles.demo)
    .pipe($.if(useSourceMaps, $.sourcemaps.init()))
    .pipe($.less().on('error', function () {this.emit('end')}))
    .pipe($.autoprefixer({
      browsers: ['last 2 version']
    }))
    .pipe($.if(isProduction, $.cssnano()))
    .pipe($.if(useSourceMaps, $.sourcemaps.write()))
    .pipe(gulp.dest(build.styles.demo))
    .pipe($.if(!isProduction, reload({
      stream: true
    })))
})

gulp.task('browser-sync', () => {
  browserSync.init({
    server: {
      baseDir: './demo/photoshop/'
    }
  })
})

gulp.task('demo', [
  'scripts:demo',
  'styles:demo',
  'watch',
  'browser-sync'
])
