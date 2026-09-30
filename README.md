# AutoApply

Search for jobs from several boards at once and send applications from one place.

Live: https://autoapply-job.vercel.app

It pulls listings from Adzuna and Arbeitnow into one list. When you hit apply, a serverless function on Vercel opens the job page in headless Chrome and fills in your name and email for you (`api/apply.ts`). The front end is React, TypeScript and Tailwind.

Made by [bxzex](https://bxzex.com).
