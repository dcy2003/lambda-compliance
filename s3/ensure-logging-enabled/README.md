Automates the configuration of audit logging on newly created S3 buckets

   - [CloudWatch Events](http://docs.aws.amazon.com/AmazonCloudWatch/latest/events/WhatIsCloudWatchEvents.html) rule triggers an [AWS Lambda](https://aws.amazon.com/lambda/) function on `s3:CreateBucket` API calls
   - Lambda function (written in [Node.js](https://nodejs.org/)) automatically ensures logging  is enabled for the bucket
   - unit tests via [Mocha](https://mochajs.org/)
   - deployment via [Serverless Framework](https://serverless.com/)

### Prerequisites

  - Requires [Node.js](https://nodejs.org/) v6.10.2+ to run.
  - Assumes you have the AWS CLI installed, credentials configured, and sufficient permissions assigned.
  - Be sure CloudTrail is enabled for the AWS account and region.

### Installation

Install the dependencies:

```sh
$ npm install -g serverless
$ npm install -g mocha
```

Build: (see `package.json`)
```sh
$ npm install
```

Test: (see `test.js`)
```sh
$ npm test
OR
$ mocha
```

Deploy: (see `serverless.yml`)
```sh
$ serverless deploy \
> 	--verbose \
>	--logbucket uniquely-named-logging-bucket \
>	--aws-profile default
```

***Notes:***

`logbucket` is a mandatory parameter

`aws-profile` is optional if you maintain multiple profiles in your `~/.aws/credentials` file