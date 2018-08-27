import fs from 'fs';
import gulp from 'gulp';
import watch from 'gulp-watch';
import imagemin from 'gulp-imagemin';
import spritesmith from 'gulp.spritesmith';
import csso from 'gulp-csso';
import uglify from 'gulp-uglify';
import jade from 'gulp-jade';
import concat from 'gulp-concat';
import connect from 'gulp-connect';
import sourcemaps from 'gulp-sourcemaps';
import postcss from 'gulp-postcss';
import rimraf from 'gulp-rimraf';
import deletelines from 'gulp-delete-lines';
import svgstore from 'gulp-svgstore';
import svgmin from 'gulp-svgmin';
import inject from 'gulp-inject';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import npmdist from 'gulp-npm-dist';
import cssnext from 'postcss-cssnext';

const path = {};

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

const config = {
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


export const clean = () => gulp
  .src(path.build.root, { read: false })
  .pipe(rimraf())

const fonts = () =>
  gulp.src(path.source.fonts + '**/*')
    .pipe(gulp.dest(path.build.fonts));

const lib = () =>
  gulp.src(path.source.lib + '**/*')
    .pipe(gulp.dest(path.build.lib));

const npmfiles = () =>
  gulp.src(npmdist(), { base: './node_modules' })
    .pipe(gulp.dest(path.build.lib));

const sprites = () => {
  const sprites =
    gulp.src(path.source.sprites + '*.png')
      .pipe(spritesmith(config.spritesmith));
  sprites.img
    .pipe(imagemin())
    .pipe(gulp.dest(path.build.sprites));
  sprites.css
    .pipe(csso())
    .pipe(gulp.dest(path.build.sprites));
  return sprites;
}

const images = () =>
  gulp.src(path.source.images + '**/*')
    .pipe(imagemin())
    .pipe(gulp.dest(path.build.images));

const svg = () => {
  const svgs = gulp.src(path.source.svg + '*.svg')
    .pipe(svgmin(file => ({ plugins: config.svg.min })))
    .pipe(rename(config.svg.rename))
    .pipe(svgstore(config.svg.store));
  const fileContents = (filePath, file) => file.contents.toString();
  return gulp.src(path.build.root + '*.html')
    .pipe(replace(config.svg.search, config.svg.replace))
    .pipe(inject(svgs, { transform: fileContents }))
    .pipe(gulp.dest(path.build.root));
}

const css = () => {
  const files = gulp.src([
    path.source.css + '*.pcss',
    path.source.blocks + '**/*.pcss',
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
    .pipe(gulp.dest(path.build.css));
  return files;
}

const js = () => {
  const files = gulp.src([
    path.source.js + '*.js',
    path.source.blocks + '**/*.js',
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
    .pipe(gulp.dest(path.build.js));
  return files;
}

const templates = () => {
  return gulp.src(path.source.templates + '*.jade')
    .pipe(jade(config.jade))
    .pipe(gulp.dest(path.build.root));
}

const server = () => {
  connect.server(config.server);
}

const serverReload = () => {
  connect.reload();
}

const watchFiles = () => {
  watch(path.source.fonts + '**/*', fonts);
  watch(path.source.lib + '**/*', lib);
  watch(path.source.sprites + '*.png', sprites);
  watch(path.source.images + '**/*', images);
  watch(path.source.svg + '*.svg', svg);
  watch([
    path.source.css + '*.pcss',
    path.source.blocks + '**/*.pcss'
  ], css);
  watch([
    path.source.js + '*.js',
    path.source.blocks + '**/*.js'
  ], js);
  watch([
    path.source.blocks + '**/*.jade',
    path.source.templates + '**/*.jade'
  ], templates);
  watch(path.source + '**/*', serverReload);
}

const build = gulp.series(
  fonts,
  lib,
  npmfiles,
  sprites,
  images,
  svg,
  css,
  js,
  templates
);
gulp.task('build', build);

export default gulp.series(
  build,
  server,
  watchFiles
);
