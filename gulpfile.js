var gulp          = require('gulp'),
    imagemin      = require('gulp-imagemin'),
    spritesmith   = require('gulp.spritesmith'),
    csso          = require('gulp-csso'),
    uglify        = require('gulp-uglify'),
    jade          = require('gulp-jade'),
    concat        = require('gulp-concat'),
    connect       = require('gulp-connect'),
    sourcemaps    = require('gulp-sourcemaps'),
    inlinecss     = require('gulp-inline-css'),
    postcss       = require('gulp-postcss'),
    rimraf        = require('gulp-rimraf'),
    autoprefixer  = require('autoprefixer'),
    nested        = require('postcss-nested'),
    simplevars    = require('postcss-simple-vars'),
    mixins        = require('postcss-mixins');

var path = {}

path.core = './core/';
path.assets = path.core + 'assets/';

path.blocks    = 'blocks/';
path.css       = 'css/';
path.images    = 'images/';
path.js        = 'js/';
path.sprite    = 'sprite/';
path.templates = 'templates/';

var pcssVariables = require(path.assets + path.css + 'variables');

var cfg = {
  spritesmith: {
    imgName: 'sprite.png',
    imgPath: '/' + path.images + 'sprite.png',
    cssName: 'sprite.css',
    padding: 10,
    imgOpts: {
      format: 'png',
      quality: 100
    }
  },
  jade: {
    pretty: true
  },
  connect: {
    port: 5000,
    root: path.core,
    livereload: true
  },
  postcss: [
    mixins,
    nested,
    simplevars: ({
      variables: pcssVariables
    }),
    autoprefixer({
      browsers: ['> 1%', 'last 4 versions', 'ie >= 9']
    })
  ]
};

gulp.task('clean', function() {
  gulp.src([
    path.assets + path.images + cfg.spritesmith.imgName,
    path.assets + path.css + cfg.spritesmith.cssName,
    path.core + path.images,
    path.core + path.css,
    path.core + path.js,
    path.core + path.templates
  ], {read: false})
    .pipe(rimraf({force: true}))
});

gulp.task('sprite', function() {
  var sprite =
    gulp.src(path.assets + path.sprite + '*.png')
      .pipe(spritesmith(cfg.spritesmith))
  sprite.img
        .pipe(imagemin())
        .pipe(gulp.dest(path.core + path.images))
  sprite.css
        .pipe(sourcemaps.init())
        .pipe(csso())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(path.core + path.css))
        .pipe(connect.reload())
});

gulp.task('images', function() {
  gulp.src(path.assets + path.images + '*')
    .pipe(imagemin())
    .pipe(gulp.dest(path.core + path.images))
    .pipe(connect.reload())
});

gulp.task('css', function() {
  var files = [
    path.assets + path.css + '*.pcss',
    path.assets + path.templates + path.blocks + '**/*.pcss',
    path.assets + path.css + '*.css'
  ];
  gulp.src(files)
    .pipe(sourcemaps.init())
    .pipe(postcss(cfg.postcss))
    .pipe(concat('app.css'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.core + path.css))
    .pipe(connect.reload())
  gulp.src(files)
    .pipe(sourcemaps.init())
    .pipe(postcss(cfg.postcss))
    .pipe(concat('app.min.css'))
    .pipe(csso())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.core + path.css))
    .pipe(connect.reload())
});

gulp.task('js', function() {
  var files = [
    path.assets + path.js + '*.js',
    path.assets + path.templates + path.blocks + '**/*.js'
  ];
  gulp.src(files)
    .pipe(sourcemaps.init())
    .pipe(concat('app.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.core + path.js))
    .pipe(connect.reload())
  gulp.src(files)
    .pipe(sourcemaps.init())
    .pipe(concat('app.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.core + path.js))
    .pipe(connect.reload())
});

gulp.task('templates', function() {
  gulp.src(path.assets + path.templates + '*.jade')
    .pipe(jade(cfg.jade))
    .pipe(gulp.dest(path.core + path.templates))
    .pipe(connect.reload())
});

gulp.task('mail', function() {
  gulp.src(path.assets + path.templates + '*.mail.jade')
    .pipe(inlinecss())
    .pipe(gulp.dest(path.core + path.templates))
    .pipe(connect.reload())
});

gulp.task('build', function() {
  gulp.start('sprite', 'images', 'css', 'js', 'templates');
});

gulp.task('watch', function() {
  gulp.watch(path.assets + path.sprite + '*', function() {
    gulp.start('sprite');
  });
  gulp.watch(path.assets + path.images + '*', function() {
    gulp.start('images');
  });
  gulp.watch([
    path.assets + path.css + '*.pcss',
    path.assets + path.blocks + '**/*.pcss'
  ], function() {
    gulp.start('css');
  });
  gulp.watch([
    path.assets + path.js + '*.js',
    path.assets + path.blocks + '**/*.js'
  ], function() {
    gulp.start('js');
  });
  gulp.watch([
    path.assets + path.templates + '*.jade',
    path.assets + path.blocks + '**/*.jade'
  ], function() {
    gulp.start('templates');
  });
});

gulp.task('connect', function() {
  connect.server(cfg.connect);
});

gulp.task('start', ['connect', 'watch']);
gulp.task('default', ['build']);
