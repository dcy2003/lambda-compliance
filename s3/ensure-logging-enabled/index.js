'use strict';

console.log('Loading function');

var AWS = require('aws-sdk');
var async = require('async');
var s3 = new AWS.S3();

/**
 *	AWS Lambda function to ensure logging is enabled on an S3 bucket
*/

exports.handler = (event, context, callback) => {
	printDebugInformation(context);
	console.log('Received event:', JSON.stringify(event, null, 2));
	var bucketName = event.detail.requestParameters.bucketName;
	console.log('bucketName = ' + bucketName);
	// use Async waterfall pattern to manage callbacks 
	async.waterfall(
		[
			async.constant(bucketName),
			createParams, 
			getLoggingStatus, 
			enableLogging
		],
		// final callback
		function(err, result) {
			if(err) {
				callback(err);
			}
			else {
				callback(null, result);
			}
		}
	);
};

function printDebugInformation(context) {
	if(context) {
		console.log('functionName =', context.functionName);
		console.log('functionVersion = ', context.functionVersion);
		console.log('invokedFunctionArn = ', context.invokedFunctionArn);
		console.log('memoryLimitInMB = ', context.memoryLimitInMB);
		console.log('AWSrequestID =', context.awsRequestId);
	    console.log('logGroupName =', context.logGroupName);
	    console.log('logStreamName =', context.logStreamName);
	    console.log('clientContext =', context.clientContext);
	    if (typeof context.identity !== 'undefined') {
	        console.log('Cognito identity ID =', context.identity.cognitoIdentityId);
	    }
	    console.log('remaining time =', context.getRemainingTimeInMillis());
	}
}

function createParams(bucketName, next) {
	console.log('Creating parameters for request');
	var params = {
		Bucket: bucketName
	};
	next(null, bucketName, params);
}

function getLoggingStatus(bucketName, params, next) {
	console.log('Checking logging configuration for bucket: ' + bucketName);
	s3.getBucketLogging(params, function(err, data) {
		if(err) {
			// an error occurred
  			console.log('Error requesting logging status for bucket: ' + bucketName);
  			console.log(err, err.stack);
  			next(err);
  		}
  		else {
  			// successful response
  			console.log('Logging status for bucket: ' + bucketName);
  			console.log(data);
  			if(data === null || data === undefined || data.LoggingEnabled === undefined) {
  				 // enable logging
  				next(null, false, bucketName);
  			}
  			else {
  				// logging is already enabled
  				next(null, true, bucketName);
  			}
  		}
	});
}

function enableLogging(alreadyEnabled, bucketName, next) {
	if (alreadyEnabled) {
		console.log('Logging is already enabled for bucket: ' + bucketName);
		next(null, 'Logging already enabled for bucket');
	}
	else {
		console.log('Enabling logging for bucket: ' + bucketName);
		var prefix = bucketName + '/';
		var params = {
		  	Bucket: bucketName,
		  	BucketLoggingStatus: {
		    	LoggingEnabled: {
		      		TargetBucket: process.env.LOG_BUCKET,
		      		TargetPrefix: prefix
		    	}
		  	}
		};
		s3.putBucketLogging(params, function(err, data) {
		  	if(err) {
		  		// an error occurred
		  		console.log('Error enablling logging for bucket: ' + bucketName);
		  		console.log(err, err.stack); 
		  		next(err);
		  	}
		  	else {
		  		// successful response
		  		console.log('Logging successfully enabled for bucket: ' + bucketName);
		  		console.log(data); 
		  		next(null, data);
		  	}
		});
	}
}