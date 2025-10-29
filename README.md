# CSV Data Dashboard
A React dashboard app that lets you upload a CSV of sales data and see simple analytics and charts.

## What it displays
- Top-level statistics: total revenue, total quantity, number of transactions, average revenue, average quantity, top product.
- Charts: revenue by product (bar), quantity by product (bar), revenue breakdown (pie), and revenue over time (line).
- A tabular view of the parsed sales data.
- A decorative ASCII animated background and a light/dark theme toggle.

The CSV must include these columns (header row):
```
date,product,quantity,revenue
```
Each row represents a sale/transaction.

## Requirements
- Node.js (v14+ recommended)
- npm (or use yarn)

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