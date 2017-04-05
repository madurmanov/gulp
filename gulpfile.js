var gulp         = require('gulp'),
    watch        = require('gulp-watch'),
    imagemin     = require('gulp-imagemin'),
    spritesmith  = require('gulp.spritesmith'),
    csso         = require('gulp-csso'),
    uglify       = require('gulp-uglify'),
    jade         = require('gulp-jade'),
    concat       = require('gulp-concat'),
    connect      = require('gulp-connect'),
    sourcemaps   = require('gulp-sourcemaps'),
    postcss      = require('gulp-postcss'),
    rimraf       = require('gulp-rimraf'),
    htmlmin      = require('gulp-htmlmin'),
    selectors    = require('gulp-selectors'),
    deletelines  = require('gulp-delete-lines'),
    base64       = require('gulp-base64'),
    svgstore     = require('gulp-svgstore'),
    svgmin       = require('gulp-svgmin'),
    inject       = require('gulp-inject'),
    rename       = require('gulp-rename'),
    replace      = require('gulp-replace'),
    mainnpmfiles = require('gulp-main-npm-files'),
    cssnext      = require('postcss-cssnext');

var path = {};

path.blocks    = 'blocks/';
path.css       = 'css/';
path.fonts     = 'fonts/'
path.images    = 'images/';
path.js        = 'js/';
path.lib       = 'lib/'
path.sprites   = 'sprites/';
path.svg       = 'svg/';
path.templates = 'templates/';

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

path.build         = {};
path.build.root    = './build/';
path.build.css     = path.build.root + path.css;
path.build.fonts   = path.build.root + path.fonts;
path.build.images  = path.build.root + path.images;
path.build.js      = path.build.root + path.js;
path.build.lib     = path.build.root + path.lib;
path.build.sprites = path.build.root + path.sprites;

var config = {
  css: {
    name: 'app',
    ext: 'css',
  },
  js: {
    name: 'app',
    ext: 'js',
  },
  spritesmith: {
    imgName: 'sprites.png',
    cssName: 'sprites.min.css',
    cssTemplate: path.source.css + 'sprites.template',
    padding: 10,
    imgOpts: {
      format: 'png',
      quality: 100,
    },
  },
  svg: {
    min: [
      {
        cleanupIDs: {
          minify: true,
        },
      },
      {
        removeTitle: true,
      },
    ],
    rename: {
      prefix: 'svgicon-',
    },
    store: {
      inlineSvg: true,
    },
    search: /<i data-svgicon="(.*)"><\/i>/g,
    replace: '<svg class="svgicon"><use xlink:href="#svgicon-$1"></svg>',
  },
  jade: {
    pretty: true,
  },
  htmlmin: {
    collapseWhitespace: true,
  },
  server: {
    port: 5000,
    root: path.build.root,
    livereload: true,
  },
  postcss: [
    cssnext(),
  ],
};


function clean(path) {
  return gulp.src(path, {read: false})
    .pipe(rimraf({force: true}));
}

function cleanBuild() {
  return clean(path.build.root);
}

function cleanFonts() {
  return clean(path.build.fonts);
}

function cleanLib() {
  return clean(path.build.lib);
}

function cleanImages() {
  return clean(path.build.images);
}

function cleanTemplates() {
  return clean(path.build.root + '*.html');
}

function fonts() {
  gulp.src(path.source.fonts + '**/*')
    .pipe(gulp.dest(path.build.fonts));
}

function lib() {
  gulp.src(path.source.lib + '**/*')
    .pipe(gulp.dest(path.build.lib));
}

function npmfiles() {
  gulp.src(mainnpmfiles(), { base: './' })
    .pipe(gulp.dest(path.build.root));
}

function sprites() {
  var sprites =
    gulp.src(path.source.sprites + '*.png')
      .pipe(spritesmith(config.spritesmith));
  sprites.img
    .pipe(imagemin())
    .pipe(gulp.dest(path.build.sprites));
  sprites.css
    .pipe(csso())
    .pipe(gulp.dest(path.build.sprites))
    .pipe(connect.reload());
}

function images() {
  gulp.src(path.source.images + '**/*')
    .pipe(imagemin())
    .pipe(gulp.dest(path.build.images))
    .pipe(connect.reload());
}

function svg() {
  var svgs = gulp.src(path.source.svg + '*.svg')
    .pipe(svgmin(function(file) {
      return { plugins: config.svg.min };
    }))
    .pipe(rename(config.svg.rename))
    .pipe(svgstore(config.svg.store));
  function fileContents(filePath, file) {
    return file.contents.toString();
  }
  gulp.src(path.build.root + '*.html')
    .pipe(replace(config.svg.search, config.svg.replace))
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
    .pipe(postcss(config.postcss))
    .pipe(concat(config.css.name + '.' + config.css.ext))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.build.css));
  files
    .pipe(sourcemaps.init())
    .pipe(postcss(config.postcss))
    .pipe(concat(config.css.name + '.min.' + config.css.ext))
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
    .pipe(concat(config.js.name + '.' + config.js.ext))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.build.js));
  files
    .pipe(sourcemaps.init())
    .pipe(concat(config.js.name + '.min.' + config.js.ext))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.build.js))
    .pipe(connect.reload());
}

function templates() {
  return gulp.src(path.source.templates + '*.jade')
    .pipe(jade(config.jade))
    .pipe(gulp.dest(path.build.root))
    .pipe(connect.reload());
}

function htmlMin() {
  return gulp.src(path.build.root + '*.html')
    .pipe(htmlmin(config.htmlmin))
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


function watchFiles() {
  watch(path.source.fonts + '**/*', function() {
    gulp.start('fonts:clean')
  });
  watch(path.source.lib + '**/*', function() {
    gulp.start('lib:clean')
  });
  watch(path.source.sprites + '*.png', function() {
    gulp.start('sprites');
  });
  watch(path.source.images + '**/*', function() {
    gulp.start('images:clean');
  });
  watch(path.source.svg + '*.svg', function() {
    gulp.start('svg:clean');
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
    path.source.templates + '**/*.jade'
  ], function() {
    gulp.start('templates:clean');
  });
}

function build() {
  gulp.start('build');
}

function server() {
  connect.server(config.server);
}

gulp.task('clean', cleanBuild);
gulp.task('clean:fonts', cleanFonts);
gulp.task('clean:lib', cleanLib);
gulp.task('clean:images', cleanImages);
gulp.task('clean:templates', cleanTemplates);
gulp.task('fonts', fonts);
gulp.task('fonts:clean', ['clean:fonts'], fonts);
gulp.task('lib', lib);
gulp.task('lib:clean', ['clean:lib'], lib);
gulp.task('npmfiles', npmfiles);
gulp.task('sprites', sprites);
gulp.task('images', images);
gulp.task('images:clean', ['clean:images'], images);
gulp.task('svg', ['templates'], svg);
gulp.task('svg:clean', ['templates:clean'], svg);
gulp.task('css', css);
gulp.task('css:base64', cssBase64);
gulp.task('js', js);
gulp.task('templates', templates);
gulp.task('templates:clean', ['clean:templates'], templates);
gulp.task('htmlmin', htmlMin);
gulp.task('selectorsmin', ['htmlmin'], selectorsMin);
gulp.task('watch', watchFiles);
gulp.task('build', [
  'fonts',
  'lib',
  'npmfiles',
  'sprites',
  'images',
  'svg',
  'css',
  'js',
  'templates',
]);
gulp.task('build:clean', ['clean'], build);
gulp.task('build:min', [
  'htmlmin',
  'selectorsmin',
]);
gulp.task('server', server);
gulp.task('default', ['watch', 'server']);
