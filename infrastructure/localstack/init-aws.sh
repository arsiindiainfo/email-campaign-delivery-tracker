#!/bin/sh
# Runs automatically on LocalStack container start (mounted to
# /etc/localstack/init/ready.d/) to provision the queues, bucket and topic
# the app expects — so `docker compose up` needs zero manual AWS setup (§27).
set -e

ENDPOINT="http://localhost:4566"
REGION="us-east-1"

awslocal() {
  aws --endpoint-url="$ENDPOINT" --region="$REGION" "$@"
}

awslocal sqs create-queue --queue-name send-queue-dlq
awslocal sqs create-queue --queue-name webhook-queue-dlq
awslocal sqs create-queue --queue-name import-queue-dlq

DLQ_SEND_ARN=$(awslocal sqs get-queue-attributes --queue-url "$ENDPOINT/000000000000/send-queue-dlq" --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)
DLQ_WEBHOOK_ARN=$(awslocal sqs get-queue-attributes --queue-url "$ENDPOINT/000000000000/webhook-queue-dlq" --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)
DLQ_IMPORT_ARN=$(awslocal sqs get-queue-attributes --queue-url "$ENDPOINT/000000000000/import-queue-dlq" --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)

awslocal sqs create-queue --queue-name send-queue --attributes "RedrivePolicy={\"deadLetterTargetArn\":\"$DLQ_SEND_ARN\",\"maxReceiveCount\":\"5\"}"
awslocal sqs create-queue --queue-name webhook-queue --attributes "RedrivePolicy={\"deadLetterTargetArn\":\"$DLQ_WEBHOOK_ARN\",\"maxReceiveCount\":\"5\"}"
awslocal sqs create-queue --queue-name import-queue --attributes "RedrivePolicy={\"deadLetterTargetArn\":\"$DLQ_IMPORT_ARN\",\"maxReceiveCount\":\"5\"}"

awslocal s3 mb s3://email-campaign-tracker-uploads

awslocal sns create-topic --name ses-notifications

echo "LocalStack seed complete: send-queue, webhook-queue (+ DLQs), uploads bucket, ses-notifications topic."
