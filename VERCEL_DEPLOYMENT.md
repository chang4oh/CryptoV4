# Deploying CryptoV4 Dashboard to Vercel

This guide provides instructions for deploying your CryptoV4 Trading Dashboard to Vercel.

## Prerequisites

- A Vercel account
- Git repository with your CryptoV4 code

## Deployment Steps

1. **Push your code to GitHub/GitLab/Bitbucket**
   Make sure all your code is committed and pushed to your repository.

2. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository
   - Select the repository containing your CryptoV4 project

3. **Configure Project Settings**
   - **Build Command**: `cd app/frontend && npm install && npm run build`
   - **Output Directory**: `app/frontend/dist`
   - **Development Command**: `npm start`

4. **Environment Variables**
   Add the following environment variables:
   - `VITE_API_BASE_URL`: Your backend API URL (e.g., https://your-api-url.com)
   - `VITE_USE_MOCK_DATA`: Set to `true` for development/demo or `false` for production

5. **Deploy**
   Click "Deploy" and wait for the build to complete.

## Post-Deployment

1. **Verify Your Deployment**
   - Check that all pages load correctly
   - Test the dashboard functionality
   - Ensure API integration works (if not using mock data)

2. **Custom Domain (Optional)**
   - Go to the "Domains" section in your Vercel project settings
   - Add your custom domain and follow the verification steps

3. **Enable Analytics (Optional)**
   - Go to the "Analytics" tab in Vercel
   - Set up analytics to monitor your dashboard's performance

## Updating Your Deployment

For future updates, simply push changes to your repository and Vercel will automatically redeploy your application.

## Troubleshooting

- **Build Failures**: Check Vercel logs for specific error messages
- **API Connection Issues**: Verify your `VITE_API_BASE_URL` is correct and accessible
- **White Screen**: Check for JavaScript errors in the browser console

## Important Notes

- The configuration provided in `vercel.json` optimizes caching and security settings
- The service worker provides offline capabilities for the PWA
- Environment variables control API endpoints and mock data usage