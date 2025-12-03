#!/usr/bin/env bash
set -euo pipefail

if [ -z "${GCP_PROJECT:-}" ] || [ -z "${GCP_REGION:-}" ]; then
  echo "Usage: GCP_PROJECT and GCP_REGION must be set in env. Example: GCP_PROJECT=my-project GCP_REGION=us-central1 ./deploy.sh"
  exit 1
fi

IMAGE=gcr.io/${GCP_PROJECT}/translation-backend:latest

echo "Building and submitting image to Cloud Build: $IMAGE"
gcloud builds submit --tag "$IMAGE"

echo "Deploying to Cloud Run..."
gcloud run deploy translation-backend \
  --image "$IMAGE" \
  --region "$GCP_REGION" \
  --platform managed \
  --allow-unauthenticated

echo "Done. Use 'gcloud run services describe translation-backend --region=$GCP_REGION --format=value(status.url)' to get URL."
