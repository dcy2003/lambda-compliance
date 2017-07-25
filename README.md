*[Navigate to subdirectories more detailed READMEs]*

Repository currently includes:
  - `s3/ensure-logging-enabled`
    - ensures audit logging is enabled on newly created S3 buckets
    - uses AWS Lambda and CloudWatch events
    - easily deployable using Serverless Framework
  - `s3/ensure-versioning-enabled`
    - (in progress) ensures versioning is enabled on newly created S3 buckets

Future ideas:
   - Lambda function to notify of globally accessible S3 buckets in account
   - Lambda function to serve as a cron health check for a REST service
   - Lambda functions to ensure EC2 compliance:
     - presence of tag (e.g. POC)
     - approved AMI
     - approved instance type
   - Lambda function to notify when an AWS Config rule enters noncompliant state
   - Node.js utility to recursively scan S3 buckets in account and print list of globally accessible objects