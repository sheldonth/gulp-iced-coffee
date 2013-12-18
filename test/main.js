var iced = require('../');
var should = require('should');
var icedcoffeescript = require('iced-coffee-script');
var gutil = require('gulp-util');
var fs = require('fs');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');
var stream = require('stream');
require('mocha');

var createFile = function (filepath, contents) {
  var base = path.dirname(filepath);
  return new gutil.File({
    path: filepath,
    base: base,
    cwd: path.dirname(base),
    contents: contents
  });
};

describe('gulp-iced-coffee', function() {
  describe('iced()', function() {
    before(function() {
      this.testData = function (expected, newPath, done) {
        var newPaths = [newPath],
            expectedSourceMap;

        if (expected.v3SourceMap) {
          expectedSourceMap = JSON.parse(expected.v3SourceMap);
          expected = [expected.js];
        } else {
          expected = [expected];
        }

        return function (newFile) {
          this.expected = expected.shift();
          this.newPath = newPaths.shift();

          should.exist(newFile);
          should.exist(newFile.path);
          should.exist(newFile.relative);
          should.exist(newFile.contents);
          newFile.path.should.equal(this.newPath);
          newFile.relative.should.equal(path.basename(this.newPath));
          String(newFile.contents).should.equal(this.expected);

          if (expectedSourceMap) {
            // check whether the sources from the iced coffee have been
            // applied to the files source map
            newFile.sourceMap.sources
              .should.containDeep(expectedSourceMap.sources);
          }

          if (done && !expected.length) {
            done.call(this);
          }
        };
      };
    });

    it('should concat two files', function(done) {
      var filepath = '/home/contra/test/file.iced';
      var contents = new Buffer('a = 2');
      var opts = {bare: true};
      var expected = icedcoffeescript.compile(String(contents), opts);

      iced(opts)
        .on('error', done)
        .on('data', this.testData(expected, '/home/contra/test/file.js', done))
        .write(createFile(filepath, contents));
    });

    it('should emit errors correctly', function(done) {
      var filepath = '/home/contra/test/file.iced';
      var contents = new Buffer('if a()\r\n  then huh');

      iced({bare: true})
        .on('error', function(err) {
          err.message.should.equal('unexpected then');
          done();
        })
        .on('data', function(newFile) {
          throw new Error('no file should have been emitted!');
        })
        .write(createFile(filepath, contents));
    });

    it('should compile a file (no bare)', function(done) {
      var filepath = 'test/fixtures/grammar.iced';
      var contents = new Buffer(fs.readFileSync(filepath));
      var expected = icedcoffeescript.compile(String(contents));

      iced()
        .on('error', done)
        .on('data', this.testData(expected, 'test/fixtures/grammar.js', done))
        .write(createFile(filepath, contents));
    });

    it('should compile a file (with bare)', function(done) {
      var filepath = 'test/fixtures/grammar.iced';
      var contents = new Buffer(fs.readFileSync(filepath));
      var opts = {bare: true};
      var expected = icedcoffeescript.compile(String(contents), opts);

      iced(opts)
        .on('error', done)
        .on('data', this.testData(expected, 'test/fixtures/grammar.js', done))
        .write(createFile(filepath, contents));
    });

    it('should compile a file with source map', function(done) {
      var filepath = 'test/fixtures/grammar.iced';
      var contents = new Buffer(fs.readFileSync(filepath));
      var expected = icedcoffeescript.compile(String(contents), {
        sourceMap: true,
        sourceFiles: ['grammar.iced'],
        generatedFile: 'grammar.js'
      });


      var stream = sourcemaps.init();
      stream.write(createFile(filepath, contents));
      stream
        .pipe(iced({}))
          .on('error', done)
          .on('data', this.testData(expected, 'test/fixtures/grammar.js', done));
    });

    it('should compile a file with bare and with source map', function(done) {
      var filepath = 'test/fixtures/grammar.iced';
      var contents = new Buffer(fs.readFileSync(filepath));
      var expected = icedcoffeescript.compile(String(contents), {
        bare: true,
        sourceMap: true,
        sourceFiles: ['grammar.iced'],
        generatedFile: 'grammar.js'
      });

      var stream = sourcemaps.init();
      stream.write(createFile(filepath, contents));
      stream
        .pipe(iced({bare: true}))
          .on('error', done)
          .on('data', this.testData(expected, 'test/fixtures/grammar.js', done));
    });

    it('should compile a file (no header)', function(done) {
      var filepath = 'test/fixtures/grammar.iced';
      var contents = new Buffer(fs.readFileSync(filepath));
      var expected = icedcoffeescript.compile(String(contents), {header: false});

      iced()
        .on('error', done)
        .on('data', this.testData(expected, 'test/fixtures/grammar.js', done))
        .write(createFile(filepath, contents));
    });

    it('should compile a file (with header)', function(done) {
      var filepath = 'test/fixtures/grammar.iced';
      var contents = new Buffer(fs.readFileSync(filepath));
      var expected = icedcoffeescript.compile(String(contents), {header: true});

      iced({header: true})
        .on('error', done)
        .on('data', this.testData(expected, 'test/fixtures/grammar.js', done))
        .write(createFile(filepath, contents));
    });

    it('should compile a literate file', function(done) {
      var filepath = 'test/fixtures/journo.liticed';
      var contents = new Buffer(fs.readFileSync(filepath));
      var opts = {literate: true};
      var expected = icedcoffeescript.compile(String(contents), opts);

      iced(opts)
        .on('error', done)
        .on('data', this.testData(expected, 'test/fixtures/journo.js', done))
        .write(createFile(filepath, contents));
    });

    it('should compile a literate file (implicit)', function(done) {
      var filepath = 'test/fixtures/journo.liticed';
      var contents = new Buffer(fs.readFileSync(filepath));
      var expected = icedcoffeescript.compile(String(contents), {literate: true});

      iced()
        .on('error', done)
        .on('data', this.testData(expected, 'test/fixtures/journo.js', done))
        .write(createFile(filepath, contents));
    });

    it('should compile a literate file (with bare)', function(done) {
      var filepath = 'test/fixtures/journo.liticed';
      var contents = new Buffer(fs.readFileSync(filepath));
      var opts = {literate: true, bare: true};
      var expected = icedcoffeescript.compile(String(contents), opts);

      iced(opts)
        .on('error', done)
        .on('data', this.testData(expected, 'test/fixtures/journo.js', done))
        .write(createFile(filepath, contents));
    });

    it('should compile a literate file with source map', function(done) {
      var filepath = 'test/fixtures/journo.liticed';
      var contents = new Buffer(fs.readFileSync(filepath));
      var expected = icedcoffeescript.compile(String(contents), {
        literate: true,
        sourceMap: true,
        sourceFiles: ['journo.liticed'],
        generatedFile: 'journo.js'
      });

      var stream = sourcemaps.init();
      stream.write(createFile(filepath, contents));
      stream
        .pipe(iced({literate: true}))
          .on('error', done)
          .on('data', this.testData(expected, 'test/fixtures/journo.js', done));
    });

    it('should compile a literate file with bare and with source map', function(done) {
      var filepath = 'test/fixtures/journo.liticed';
      var contents = new Buffer(fs.readFileSync(filepath));
      var expected = icedcoffeescript.compile(String(contents), {
        literate: true,
        bare: true,
        sourceMap: true,
        sourceFiles: ['journo.liticed'],
        generatedFile: 'journo.js'
      });

      var stream = sourcemaps.init();
      stream.write(createFile(filepath, contents));
      stream
        .pipe(iced({literate: true, bare: true}))
          .on('error', done)
          .on('data', this.testData(expected, 'test/fixtures/journo.js', done));
    });

    it('should rename a literate markdown file', function(done) {
      var filepath = 'test/fixtures/journo.iced.md';
      var contents = new Buffer(fs.readFileSync(filepath));
      var opts = {literate: true};
      var expected = icedcoffeescript.compile(String(contents), opts);

      iced(opts)
        .on('error', done)
        .on('data', this.testData(expected, 'test/fixtures/journo.js', done))
        .write(createFile(filepath, contents));
    });
  });
});
