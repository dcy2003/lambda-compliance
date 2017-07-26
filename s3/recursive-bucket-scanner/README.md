Recursively scans an S3 bucket and prints a list of globally accessible objects to the console.

### Prerequisites

  - Requires [Node.js](https://nodejs.org/)
  - Assumes you have the AWS CLI installed, credentials configured, and sufficient permissions assigned.

### Installation

Install the dependencies:
```sh
$ npm install
```

Execute:
```sh
$ node recursiveS3bucketScanner.js my-bucket-to-scan
```

***Notes:***

Be sure to pass the name of the S3 bucket to scan as a command line argument

### TODO

Unit Tests