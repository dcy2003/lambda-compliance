'use strict';

console.log('Loading function');

var AWS = require('aws-sdk');
var async = require('async');
var s3 = new AWS.S3();

/**
 *	AWS Lambda function to ensure versioning is enabled on an S3 bucket
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
			getVersioningStatus, 
			enableVersioning
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

function getVersioningStatus function(bucketName, params, next) {
	console.log('Checking versioning configuration for bucket: ' + bucketName);
	s3.getBucketVersioning(params, function(err, data) {
  		if(err) {
  			// an error occurred
  			console.log('Error requesting versioning status for bucket: ' + bucketName);
  			console.log(err, err.stack);
  			next(err);
  		}
  		else {
  			// successful response
  			console.log('Versioning status for bucket: ' + bucketName);
  			console.log(data);
  			if(data === null || data === undefined || data.Status === undefined || data.Status !== 'Enabled') {
  				// enable versioning
  				next(null, false, bucketName);
  			}
  			else {
  				// versioning is already enabled
  				next(null, true, bucketName);
  			}
  		}
	});
}

function enableVersioning(alreadyEnabled, bucketName, next) {
	if (alreadyEnabled) {
		console.log('Versioning is already enabled for bucket: ' + bucketName);
		next(null, 'Versioning already enabled for bucket');
	}
	else {
		console.log('Enabling versioning for bucket: ' + bucketName);
		var params = {
			Bucket: bucketName, 
		  	VersioningConfiguration: {
		   		MFADelete: "Disabled", 
		   		Status: "Enabled"
		  	}
		 };
		 s3.putBucketVersioning(params, function(err, data) {
		   	if(err) {
		   		// an error occurred
		  		console.log('Error enablling versioning for bucket: ' + bucketName);
		  		console.log(err, err.stack);
		  		next(err);
		  	}
		  	else {
		  		// successful response
		  		console.log('Versioning successfully enabled for bucket: ' + bucketName);
		  		console.log(data);
		  		next(null, data);
		  	}
		 });
	}
}