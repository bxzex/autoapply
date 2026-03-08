# AutoApply

A private, high-performance job aggregator that runs entirely in your browser. No middleman, no data tracking, and no subscriptions.

## Core Features

- **Multi-Source Engine**: Aggregates live listings from 5 providers: Adzuna, Techmap, Fantastic.jobs, Jobicy, and OkJob.
- **Local Vector Matching**: Your resume is converted into a mathematical vector on your own device. We match you to jobs by calculating the "semantic distance" between your experience and the job description.
- **Zero-Trust Privacy**: Your resume text and profile data never hit a server. Everything is stored in your local browser's IndexedDB.
- **Serverless Search Core**: Built with Vercel Serverless functions to bypass CORS restrictions while maintaining $0 operational costs.
- **Tailoring Engine**: Generates strategic recommendations for specific roles to increase match probability.

## Setup & Deployment

The system is optimized for Vercel deployment but can be run locally for development.

### Local Development
1. Install dependencies: `npm install`
2. Launch dev server: `npm run dev`
3. Access at `localhost:5173`

### Deployment
The project includes a `vercel.json` configuration for immediate deployment. 
1. Push code to GitHub.
2. Import repository into Vercel.
3. Done.

## Technical Foundation
- **Frontend**: React + TypeScript + Tailwind CSS
- **Local ML**: Transformers.js (Feature Extraction)
- **Database**: Browser-native IndexedDB
- **Infrastructure**: Vercel (Edge Functions)

Developed by [bxzex](https://github.com/bxzex)
