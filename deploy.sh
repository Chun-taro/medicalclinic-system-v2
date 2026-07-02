#!/bin/bash

# Clear and easy to follow deployment script for BukSU Med Clinic
echo "========================================="
echo "   BukSU Med Clinic Deployment Script    "
echo "========================================="

echo "[1/3] Stopping any currently running containers..."
docker compose down

echo "[2/3] Building and starting containers in detached mode..."
docker compose up -d --build

echo "[3/3] Verifying running containers..."
docker ps

echo "========================================="
echo " Deployment successful!"
echo " Access the system at: http://167.172.73.9/buksumedclinic"
echo "========================================="
