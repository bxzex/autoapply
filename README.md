# Auto-Apply AI

A 100% local, GPU-powered job application assistant that runs entirely in your browser.

## Features

- **Local GPU Processing**: Uses WebGPU and `transformers.js` to parse your resume and match jobs.
- **Privacy First**: Your resume and personal data never leave your computer. Everything is stored in your browser's `IndexedDB`.
- **Semantic Job Matching**: Matches you to jobs based on the actual meaning of your skills and experience, not just keywords.
- **Tailoring Engine**: Provides strategic recommendations for each job to increase your application's relevance.
- **GitHub Pages Ready**: Can be hosted for free on GitHub Pages with zero server-side costs.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **ML Engine**: Transformers.js (WebGPU)
- **Local Database**: IndexedDB (via `idb`)
- **PDF Parsing**: PDF.js

## Getting Started

1.  **Clone the repository** (if you've downloaded it).
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run the development server**:
    ```bash
    npm run dev
    ```
4.  **Open the app**: Go to `http://localhost:5173`.

## Deployment

To deploy to GitHub Pages:

1.  Update the `base` field in `vite.config.ts` if your repository name is not the root.
2.  Run `npm run build`.
3.  Deploy the contents of the `dist/` folder.

## Future Roadmap

- **Browser Extension Integration**: For true "one-click" auto-applying to LinkedIn, Indeed, etc.
- **Advanced LLMs**: Integrate larger models like Phi-3 or Llama-3 for complete cover letter generation.
- **Job Board APIs**: Native integration with Adzuna, Reed, and Jooble.
