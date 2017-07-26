This repository contains a collection of useful solutions for automation within an AWS account.

*[Navigate to subdirectories for more detailed READMEs]*

### Repository currently includes:

  - `s3/ensure-logging-enabled`
    - ensures audit logging is enabled on newly created S3 buckets
    - uses AWS Lambda and CloudWatch events
    - easily deployable using Serverless Framework
  - `s3/ensure-versioning-enabled`
    - ensures versioning is enabled on newly created S3 buckets
    - uses AWS Lambda and CloudWatch events
    - easily deployable using Serverless Framework
  - `s3/recursive-bucket-scanner`
    - Node.js utility to recursively scan an S3 bucket and print list of globally accessible objects

### Future ideas:

   - Lambda function to notify of globally accessible S3 buckets in account
   - Lambda function to notify when an AWS Config rule enters noncompliant state
   - Lambda function to serve as a cron health check for a REST service
   - Lambda functions to ensure EC2 compliance:
     - presence of tag (e.g. POC)
     - approved AMI
     - approved instance type

### Development

Want to contribute? Great!  Submit a pull request.

License
----

MIT
