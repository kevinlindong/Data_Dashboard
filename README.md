# CSV Data Dashboard
A React dashboard app that lets you upload a CSV of sales data and see simple analytics and charts.

## What it displays
- High-level analysis: total revenue, total quantity, number of transactions, average revenue, average quantity, top product.
- Charts: revenue by product (bar), quantity by product (bar), revenue breakdown (pie), and revenue over time (line).
- A tabular view of the parsed sales data.

The CSV must include these columns in this format:
```
date,product,quantity,revenue
```

## Requirements
- Node.js (v14+ recommended)
- npm

## Install
From the project root (`arpari_project`):
```bash
npm install
```

## Run (development)
```bash
npm start
```

This runs the app with `react-scripts start` and opens a browser at `http://localhost:3000` by default.