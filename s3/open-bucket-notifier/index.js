'use strict';

console.log('Loading function');

var AWS = require('aws-sdk');
var sns = new AWS.SNS();
var async = require('async');
var request = require('request');
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
			async.constant(bucketName, context),
			checkBucketPermissions, 
			checkBucketPermissionsRedirect
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

function publishToSns(bucketName, context) {
	var text = 'ALERT: S3 bucket ' + bucketName + ' is globally accessible!';
	var params = {
        Message: text, 
        Subject: text,
        TopicArn: process.env.SNS_TOPIC_ARN
    };
    sns.publish(params, context.done);
}

function checkBucketPermissions(bucketName, context, next) {
	var url = 'https://s3.amazonaws.com/' + bucketName;
    request(url, function(err, response, body) {
    	if(err) {
    		// an error occurred
  			console.log('Error checking permissions for bucket: ' + bucketName);
  			console.log(err, err.stack);
  			next(err);
    	}
    	else {
    		console.log('Attempting to access bucket ' + bucketName);
	        console.log('response: ' + response.statusCode);
	        if(response.statusCode === 403) {
	        	// received forbidden
	        	next(null, false, bucketName, response);
	        }
	        else {
	            if(response.statusCode === 301) {
	            	// received redirect
	                console.log('Received redirect.  Following...');
	                next(null, true, bucketName, context);
	            }
	            else if(response.statusCode === 200) {
	            	// received OK
	                console.log(bucketName + ' is globally accessible!');
	                publishToSns(bucketName, context);
	                next(null, false, bucketName, null);
	            }
	            else {
	                console.log('Received unexpected response status code ' + response.statusCode);
	                next(null, false, bucketName, null);
	            }
	        }
    	}
    });
}

function checkBucketPermissionsRedirect(redirect, bucketName, context, next) {
	if(!redirect) next(null, null);
	else {
		var url = 'https://' + bucketName + '.s3.amazonaws.com';
	    request(url, function(err, response, body) {
	    	if(err) {
	    		// an error occurred
	  			console.log('Error checking permissions for bucket: ' + bucketName);
	  			console.log(err, err.stack);
	  			next(err);
	    	}
	    	else {
	    		console.log('Attempting to access bucket ' + bucketName + ' via alternate S3 URL');
		        console.log('response: ' + response.statusCode);
		        if(response.statusCode === 403) {
			        	// received forbidden
			        	next(null, null);
			        }
		        else {
		            if(response.statusCode === 200) {
		            	// received OK
		                console.log(bucketName + ' is globally accessible!');
		                publishToSns(bucketName, context);
		                next(null, null);
		            }
		            else {
		                console.log('Received unexpected response status code ' + response.statusCode);
		                next(null, null);
		            }
		        }
	    	}
	    });
	}
}