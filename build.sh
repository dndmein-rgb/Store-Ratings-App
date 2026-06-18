#!/bin/bash
set -e

echo "Installing root dependencies..."
npm install

echo "Installing backend dependencies..."
npm install --prefix backend

echo "Installing frontend dependencies..."
npm install --prefix frontend

echo "Building frontend..."
cd frontend
npm run build
cd ..

echo "✓ Build complete"
