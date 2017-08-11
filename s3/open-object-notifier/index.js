'use strict';

console.log('Loading function');

var AWS = require('aws-sdk');
var sns = new AWS.SNS();
var s3 = new AWS.S3();
var AUTHENTICATED_USERS = "http://acs.amazonaws.com/groups/global/AuthenticatedUsers";
var ALL_USERS = "http://acs.amazonaws.com/groups/global/AllUsers";

/**
 *	AWS Lambda function to notify if an S3 object is globally accessible
*/

exports.handler = (event, context, callback) => {
	printDebugInformation(context);
	console.log('Received event:', JSON.stringify(event, null, 2));
	var bucketName = event.detail.requestParameters.bucketName;
	console.log('bucketName = ' + bucketName);
	var objectKey = event.detail.requestParameters.key;
	console.log('objectKey = ' + objectKey);
	checkObjectAcl(bucketName, objectKey, context, callback);
};

function checkObjectAcl(bucketName, objectKey, context, callback) {
  var params = {
    Bucket: bucketName,
    Key: objectKey
  };
  var getObjectAclPromise = s3.getObjectAcl(params).promise();
  getObjectAclPromise.then(
  	function(data) {
  		for (var grant in data.Grants) {
          var grantee = data.Grants[grant].Grantee;
          if(grantee.Type === 'Group') {
            var who;
            if(grantee.URI === AUTHENTICATED_USERS) who = "AuthenticatedUsers";
            else if(grantee.URI === ALL_USERS) who = "AllUsers";
            else who = 'Unknown user (verify in console)';
            var permission = data.Grants[grant].Permission;
            var msg = bucketName + '/' + objectKey + ' | ' + who + " | " + permission;
            console.log(msg);
            publishToSns(bucketName, objectKey, msg, context);
          }
        }
        callback(null, null);
  	},
  	function(err) {
  		console.log(err); // an error occurred
    	callback(err, null);
  	}
  );
}

function publishToSns(bucketName, objectKey, msg, context) {
	var subj = 'ALERT: S3 object ' + objectKey + ' in bucket ' + bucketName + ' is globally accessible!';
	var msg = '';
	var params = {
        Message: msg, 
        Subject: subj,
        TopicArn: process.env.SNS_TOPIC_ARN
    };
    sns.publish(params, context.done);
}

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