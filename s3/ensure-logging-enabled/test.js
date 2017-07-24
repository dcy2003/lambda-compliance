'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require("sinon-chai");
var rewire = require('rewire');
var expect = chai.expect;
var assert = chai.assert;
chai.use(sinonChai);

var sampleRequestData = {
  "detail": {
    "requestParameters": {
      "bucketName": "the-new-bucket"
    }
  }
};

describe('LambdaFunction', function() {
  var getBucketLoggingStub, putBucketLoggingStub, callbackSpy, module;

  describe('#execute', function() {
    before(function(done) {
      getBucketLoggingStub = sinon.stub().yields(null, {});
      putBucketLoggingStub = sinon.stub().yields(null, null);
      callbackSpy = sinon.spy();

      var callback = function(error, result) {
        callbackSpy.apply(null, arguments);
        done();
      }

      module = getModule(getBucketLoggingStub, putBucketLoggingStub);
      module.handler(sampleRequestData, null, callback);
    });

    it('should run our function once', function() {
      expect(callbackSpy).has.been.calledOnce;
    });

    it('should not have returned an error', function() {
      assert.equal(callbackSpy.args[0][0], null, 'err is null');
    });
  });
});

function getModule(getBucketLogging, putBucketLogging) {
  var rewired = rewire('./index.js');

  rewired.__set__({
    's3': { 
      getBucketLogging: getBucketLogging,
      putBucketLogging: putBucketLogging
    }
  });

  return rewired;
}