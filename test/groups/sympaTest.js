'use strict';

var conf = require('./../../testutil/configureForTest');
var expect = require('must');
var sinon = require('sinon').sandbox.create();
var proxyquireStrict = require('proxyquire').noCallThru();

var soapsympastub = {};
var sympa = proxyquireStrict('../../lib/groups/sympa', {'soap-sympa': soapsympastub});

describe('The Sympa adapter', function () {
  var authenticateRemoteAppAndRun;
  var soapResult;

  beforeEach(function () {
    authenticateRemoteAppAndRun = sinon.spy(function (args, callback) {
      return callback(null, soapResult);
    });

    soapsympastub.createClient = function (url, callback) {
      callback(null, {authenticateRemoteAppAndRun: authenticateRemoteAppAndRun});
    };
  });

  afterEach(function () {
    sinon.restore();
    delete soapsympastub.createClient;
  });

  describe(' - Standard Calls', function () {

    it('"getAllAvailableLists" - results transformed (suffix stripped)', function (done) {
      soapResult = {listInfo: {item: [
        {listAddress: 'a@localhost'},
        {listAddress: 'b@localhost'}
      ]}};

      sympa.getAllAvailableLists(function (err, result) {
        var variables = authenticateRemoteAppAndRun.args[0][0];
        expect(result).to.contain('a');
        expect(result).to.contain('b');
        expect(result).to.not.contain('b@localhost');
        expect(variables.service).to.be('complexLists');
        expect(variables.vars).to.be('USER_EMAIL=null');
        expect(variables.parameters).to.be(undefined);
        done(err);
      });
    });

    it('"getSubscribedListsForUser" - results transformed (suffix stripped)', function (done) {
      soapResult = {return: {item: [
        {listAddress: 'a@localhost'},
        {listAddress: 'b@localhost'}
      ]}};

      sympa.getSubscribedListsForUser('username', function (err, result) {
        var variables = authenticateRemoteAppAndRun.args[0][0];
        expect(result).to.contain('a');
        expect(result).to.contain('b');
        expect(result).to.not.contain('b@localhost');
        expect(variables.service).to.be('complexWhich');
        expect(variables.vars).to.be('USER_EMAIL=username');
        expect(variables.parameters).to.be(undefined);
        done(err);
      });
    });

    it('"getUsersOfList" - results transformed  (suffix NOT stripped)', function (done) {
      soapResult = {return: {item: [
        'a@localhost', 'b@localhost'
      ]}};

      sympa.getUsersOfList('listname', function (err, result) {
        var variables = authenticateRemoteAppAndRun.args[0][0];
        expect(result).to.contain('a@localhost');
        expect(result).to.contain('b@localhost');
        expect(result).to.not.contain('b');
        expect(variables.service).to.be('review');
        expect(variables.vars).to.be('USER_EMAIL=null');
        expect(variables.parameters).to.eql(['listname@localhost']);
        done(err);
      });
    });

    it('"addUserToList" - results transformed', function (done) {
      sympa.addUserToList('email', 'listname', function (err, result) {
        var variables = authenticateRemoteAppAndRun.args[0][0];
        expect(variables.service).to.be('add');
        expect(variables.vars).to.be('USER_EMAIL=null');
        expect(variables.parameters).to.eql(['listname@localhost', 'email']);
        done(err);
      });
    });

    it('"removeUserFromList" - results transformed', function (done) {
      sympa.removeUserFromList('email', 'listname', function (err, result) {
        var variables = authenticateRemoteAppAndRun.args[0][0];
        expect(variables.service).to.be('del');
        expect(variables.vars).to.be('USER_EMAIL=null');
        expect(variables.parameters).to.eql(['listname@localhost', 'email']);
        done(err);
      });
    });
  });

  describe('- Error handling', function () {

    it('"addUserToList" - handles adding an already added user', function (done) {
      authenticateRemoteAppAndRun = sinon.spy(function (args, callback) {
        return callback(new Error('Error: soap:Server: Unable to add user: User already member of list somegroup@localhost'));
      });

      sympa.addUserToList('email', 'listname', function (err) {
        done(err);
      });
    });

    it('"addUserToList" - handles technical errors', function (done) {
      authenticateRemoteAppAndRun = sinon.spy(function (args, callback) {
        return callback(new Error('Error: soap:Server: something bad happened'));
      });

      sympa.addUserToList('email', 'listname', function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('"removeUserFromList" - handles adding an already removed user', function (done) {
      authenticateRemoteAppAndRun = sinon.spy(function (args, callback) {
        return callback(new Error('Error: soap:Client: Not subscribed: Not member of list or not subscribed'));
      });

      sympa.removeUserFromList('email', 'listname', function (err) {
        done(err);
      });
    });

    it('"removeUserFromList" - handles technical errors', function (done) {
      authenticateRemoteAppAndRun = sinon.spy(function (args, callback) {
        return callback(new Error('Error: soap:Server: something bad happened'));
      });

      sympa.removeUserFromList('email', 'listname', function (err) {
        expect(err).to.exist();
        done();
      });
    });

  });
});
