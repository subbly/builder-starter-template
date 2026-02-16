FROM ghcr.io/codesandbox/devcontainers/typescript-node:22

RUN apt-get update && apt-get install -y ripgrep jq && apt-get clean

RUN su node -c "npm install -g netlify-cli pnpm chokidar-cli pm2"