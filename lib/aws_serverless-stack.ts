import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class AwsServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the SSM parameter for the email address
    const emailAddressParameter = new ssm.StringParameter(this, 'EmailAddressParameter', {
      parameterName: 'emailAddressAWSCost',
      stringValue: 'ryan_lee@live.com',  // replace with your email address
    });

    // Create Lambda function
    const usageFunction = new lambda.Function(this, 'UsageFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'), // Directory containing your Lambda code
    });

    // Create SNS topic
    const usageTopic = new sns.Topic(this, 'UsageTopic');

    // Subscribe Lambda function to the topic
    usageTopic.addSubscription(new subscriptions.LambdaSubscription(usageFunction));

    // Grant permissions to Lambda function
    usageFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail'],
      resources: ['*'], // Adjust permissions as needed
    }));

    // Create a CloudWatch Events rule to trigger every week
    const rule = new events.Rule(this, 'Rule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '12', weekDay: 'MON' }),
    });

    // Add the SNS topic as a target of the rule
    rule.addTarget(new targets.SnsTopic(usageTopic));

    // Create SES email address
    //const emailAddress = 'ryan_lee@live.com'; // Replace with your verified email
    // Send an email from Lambda
    //usageFunction.addEnvironment('RECIPIENT_EMAIL', emailAddress);

    emailAddressParameter.grantRead(usageFunction);
  }
}
