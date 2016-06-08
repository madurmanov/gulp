var gulp          = require('gulp'),
    watch         = require('gulp-watch'),
    imagemin      = require('gulp-imagemin'),
    spritesmith   = require('gulp.spritesmith'),
    csso          = require('gulp-csso'),
    uglify        = require('gulp-uglify'),
    jade          = require('gulp-jade'),
    concat        = require('gulp-concat'),
    connect       = require('gulp-connect'),
    sourcemaps    = require('gulp-sourcemaps'),
    postcss       = require('gulp-postcss'),
    rimraf        = require('gulp-rimraf'),
    htmlmin       = require('gulp-htmlmin'),
    selectors     = require('gulp-selectors'),
    deletelines   = require('gulp-delete-lines'),
    base64        = require('gulp-base64'),
    svgstore      = require('gulp-svgstore'),
    svgmin        = require('gulp-svgmin'),
    inject        = require('gulp-inject'),
    rename        = require('gulp-rename'),
    autoprefixer  = require('autoprefixer'),
    nested        = require('postcss-nested'),
    simplevars    = require('postcss-simple-vars'),
    mixins        = require('postcss-mixins');

var path = {};

path.blocks     = 'blocks/';
path.css        = 'css/';
path.fonts      = 'fonts/'
path.images     = 'images/';
path.js         = 'js/';
path.lib        = 'lib/'
path.sprites    = 'sprites/';
path.svg        = 'svg/';
path.templates  = 'templates/';

path.source           = {};
path.source.root      = './source/';
path.source.blocks    = path.source.root + path.blocks;
path.source.css       = path.source.root + path.css;
path.source.fonts     = path.source.root + path.fonts;
path.source.images    = path.source.root + path.images;
path.source.js        = path.source.root + path.js;
path.source.lib       = path.source.root + path.lib;
path.source.sprites   = path.source.root + path.sprites;
path.source.svg       = path.source.root + path.svg;
path.source.templates = path.source.root + path.templates;

path.build        = {};
path.build.root   = './build/';
path.build.css    = path.build.root + path.css;
path.build.fonts  = path.build.root + path.fonts;
path.build.images = path.build.root + path.images;
path.build.js     = path.build.root + path.js;
path.build.lib    = path.build.root + path.lib;

var cfg = {
  spritesmith: {
    imgName: 'sprite.png',
    imgPath: path.build.images + 'sprite.png',
    cssName: 'sprite.min.css',
    cssTemplate: path.source.css + 'sprite.template',
    padding: 10,
    imgOpts: {
      format: 'png',
      quality: 100
    }
  },
  svg: {
    min: {
      cleanupIDs: {
        minify: true
      }
    },
    rename: {
      prefix: 'svgicon-'
    },
    store: {
      inlineSvg: true
    }
  },
  jade: {
    pretty: true
  },
  htmlmin: {
    collapseWhitespace: true
  },
  connect: {
    port: 5000,
    root: path.build.root,
    livereload: true
  },
  postcss: [
    mixins({
      mixinsDir: path.source.css + 'mixins'
    }),
    nested,
    simplevars({
      variables: require(path.source.css + 'variables')
    }),
    autoprefixer({
      browsers: ['> 1%', 'last 4 versions', 'ie >= 9']
    })
  ]
};

function clean() {
  gulp.src(path.build.root, {read: false})
    .pipe(rimraf({force: true}));
}

function fonts() {
  gulp.src(path.source.fonts + '*')
    .pipe(gulp.dest(path.build.fonts));
}

function lib() {
  gulp.src(path.source.lib + '**/*')
    .pipe(gulp.dest(path.build.lib));
}

function sprite() {
  var sprite =
    gulp.src(path.source.sprites + '*.png')
      .pipe(spritesmith(cfg.spritesmith));
  sprite.img
    .pipe(imagemin())
    .pipe(gulp.dest(path.build.images));
  sprite.css
    .pipe(csso())
    .pipe(gulp.dest(path.build.css))
    .pipe(connect.reload());
}

function images() {
  gulp.src(path.source.images + '*')
    .pipe(imagemin())
    .pipe(gulp.dest(path.build.images))
    .pipe(connect.reload());
}

function svg() {
  var svgs = gulp.src(path.source.svg + '*.svg')
    .pipe(svgmin(function(file) {
      return { plugins: [cfg.svg.min] };
    }))
    .pipe(rename(cfg.svg.rename))
    .pipe(svgstore(cfg.svg.store));
  function fileContents(filePath, file) {
    return file.contents.toString();
  }
  gulp.src(path.build.root + '*.html')
    .pipe(inject(svgs, { transform: fileContents }))
    .pipe(gulp.dest(path.build.root));
}

function css() {
  var files = gulp.src([
    path.source.css + '*.pcss',
    path.source.blocks + '**/*.pcss'
  ]);
  files
    .pipe(sourcemaps.init())
    .pipe(postcss(cfg.postcss))
    .pipe(concat('app.css'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.build.css));
  files
    .pipe(sourcemaps.init())
    .pipe(postcss(cfg.postcss))
    .pipe(concat('app.min.css'))
    .pipe(csso())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.build.css))
    .pipe(connect.reload());
}

function cssBase64() {
  gulp.src(path.build.css + '*.css')
    .pipe(base64())
    .pipe(gulp.dest(path.build.css));
}

function js() {
  var files = gulp.src([
    path.source.js + '*.js',
    path.source.blocks + '**/*.js'
  ]);
  files
    .pipe(sourcemaps.init())
    .pipe(concat('app.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.build.js));
  files
    .pipe(sourcemaps.init())
    .pipe(concat('app.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.build.js))
    .pipe(connect.reload());
}

function templates() {
  gulp.src(path.source.templates + '*.jade')
    .pipe(jade(cfg.jade))
    .pipe(gulp.dest(path.build.root))
    .pipe(connect.reload());
}

function htmlMin() {
  gulp.src(path.build.root + '*.html')
    .pipe(htmlmin(cfg.htmlmin))
    .pipe(gulp.dest(path.build.root));
}

function selectorsMin() {
  gulp.src(path.build.root + '*.html')
    .pipe(selectors.run())
    .pipe(gulp.dest(path.build.root));
  gulp.src(path.build.css + '*.css')
    .pipe(selectors.run())
    .pipe(deletelines({
      'filters': [
        /\/\*#\ssourceMap/i
      ]
    }))
    .pipe(gulp.dest(path.build.css));
  gulp.src(path.build.css + '*.map', {read: false})
    .pipe(rimraf());
}

function server() {
  connect.server(cfg.connect);
}

function watchFiles() {
  watch(path.source.sprites + '*', function() {
    gulp.start('sprite');
  });
  watch(path.source.images + '*', function() {
    gulp.start('images');
  });
  watch([
    path.source.css + '*.pcss',
    path.source.blocks + '**/*.pcss'
  ], function() {
    gulp.start('css');
  });
  watch([
    path.source.js + '*.js',
    path.source.blocks + '**/*.js'
  ], function() {
    gulp.start('js');
  });
  watch([
    path.source.blocks + '**/*.jade',
    path.source.templates + '*.jade'
  ], function() {
    gulp.start('templates');
  });
}

gulp.task('clean', clean);
gulp.task('fonts', fonts);
gulp.task('lib', lib);
gulp.task('sprite', sprite);
gulp.task('images', images);
gulp.task('svg', svg);
gulp.task('css', css);
gulp.task('css:base64', cssBase64);
gulp.task('js', js);
gulp.task('templates', templates);
gulp.task('htmlmin', htmlMin);
gulp.task('selectorsmin', selectorsMin);
gulp.task('server', server);
gulp.task('watch', watchFiles);
gulp.task('build', [
  'fonts',
  'lib',
  'sprite',
  'images',
  'css',
  'js',
  'templates'
]);
gulp.task('build:min', [
  'htmlmin',
  'selectorsmin'
]);
gulp.task('default', ['watch', 'server']);
