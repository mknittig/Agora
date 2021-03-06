'use strict';
var stream = require('stream');
var conf = require('../../testutil/configureForTest');
var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = conf.get('beans');
var galleryrepository = beans.get('galleryrepositoryService');

var createApp = require('../../testutil/testHelper')('galleryApp').createApp;

var OK = 200;
var CREATED = 201;

describe('/gallery', function () {
  var storedImageId = 'image.jpg';
  var imagePath = __dirname + '/fixtures/' + storedImageId;
  var generatedImageId;
  var storedImagePath;

  afterEach(function () {
    sinon.restore();
  });

  describe('POST /', function () {
    beforeEach(function () {
      generatedImageId = '8fe5861b-53cb-49db-929f-81eb77b4d05c';
      sinon.stub(galleryrepository, 'storeImage', function (imagePath, callback) {
        storedImagePath = imagePath;
        callback(null, generatedImageId);
      });
    });

    it('responds with the image Location', function (done) {
      var app = createApp();
      request(app)
        .post('/')
        .attach('imageFile', imagePath)
        .expect(CREATED)
        .expect('Location', app.path() + '/' + generatedImageId, done);
    });

    it('rejects empty images');
  });

  describe('GET /{imageId}', function () {
    it('responds with the image', function (done) {
      sinon.stub(galleryrepository, 'retrieveImage', function (imageId, callback) {
        if (storedImageId === imageId) {
          callback(null, imagePath);
        }
      });

      request(createApp())
        .get('/'  + storedImageId)
        .expect(OK)
        .expect('Content-Type', 'image/jpeg', done);
    });
  });

  describe('GET /', function () {
    it('renders the upload form', function (done) {
      request(createApp())
        .get('/')
        .expect(OK, done);
    });
  });

});
