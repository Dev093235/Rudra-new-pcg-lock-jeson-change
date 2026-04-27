name: Node.js CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x]   # 👈 Node 18 use kar, 20 mat rakh

    steps:
      - uses: actions/checkout@v2

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v2
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install system dependencies for better-sqlite3
        run: |
          sudo apt-get update
          sudo apt-get install -y python3 make g++ build-essential

      - name: Clean and Install dependencies
        run: |
          rm -rf node_modules package-lock.json
          npm cache clean --force
          npm install --build-from-source=false

      - name: Start the bot
        env:
          PORT: 8080
        run: npm start
