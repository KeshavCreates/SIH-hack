# TermsGuard (SIH Hackathon Build)

This repo is my Smart India Hackathon implementation of TermsGuard, an AI tool that breaks down legal documents into plain language.

## What I built

I built this version to prove the core workflow fast: upload a legal document image, run AI analysis, and return a readable report with clear risks.

## Core features

- Document image upload and preview
- AI-generated summary and key details
- Risk list with severity labels
- Serverless analysis endpoint (`/api/analyze`)

## Stack

- Vanilla HTML/CSS/JS frontend
- Vercel Serverless Function
- Gemini API
- `multer` + `node-fetch`

## Run locally

```bash
npm install
export GEMINI_API_KEY=your_key_here
npx vercel dev
```

Open the local Vercel URL and test the upload + analysis flow.
