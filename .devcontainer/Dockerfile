FROM ghcr.io/codesandbox/devcontainers/typescript-node:0.5

RUN apt-get update && apt-get install -y ripgrep && apt-get clean

RUN su node -c "npm install -g netlify-cli pnpm"