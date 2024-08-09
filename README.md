# Serverless DMARC Processor

This serverless function will process DMARC records that are sent through Amazon SES and saved to S3.

## How to set up DMARC receiving in AWS

1. Set up a bucket
   1. Set up S3 Permissions for SES
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowSESPuts",
         "Effect": "Allow",
         "Principal": {
           "Service": "ses.amazonaws.com"
         },
         "Action": "s3:PutObject",
         "Resource": "arn:aws:s3:::**THIS IS YOUR BUCKET NAME**/*",
         "Condition": {
           "StringEquals": {
             "aws:Referer": "**THIS IS YOUR AWS ACCOUNT ID**"
           }
         }
       }
     ]
   }
   ```
2. Set up a RDS database
   1. Database Schema = `dmarc`
   2. See `bobby-tables.sql` or set up `src/schema.ts` with Drizzle-kit
3. Configure Lambda function.
   1. Required Enviromental variables
      1. `DB_HOST`
      2. `DB_USER`
      3. `DB_PASS`
4. Set up SES reporting
   1. Create new verfied identity
      1. Email address
   2. Create Email receiving rule set
   3. Create Email receiving rule
      1. No Conditions
      2. Actions: Deliver to Amazon S3 bucket
   4. Resend verified identity verification email
   5. Check S3 bucket for verification email mime
      1. Download it and open it with text editor
      2. Open link in the document to verify the email account

## How to setup DMARC Reporting in your DNS Provider

1. Enable DKIM and SPF on your domain
2. Generate a DMARC txt record (https://dmarcian.com/dmarc-record-wizard/)
   1. RUA Address = `mailto:**THE ADDRESS FROM STEP 4.1**`
3. Add DNS record to your DNS provider.

## How to setup reporting

- TODO

## TODO

- Can record.policy_published be an array?
- Is there a way to validate the enums in TS before insert?
- Can DKIM & SPF be for multiple domains?
