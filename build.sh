cd frontend && npm run build && cd ..
time docker buildx build -t kc_purchases:latest --platform linux/amd64 .