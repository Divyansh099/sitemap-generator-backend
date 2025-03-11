# Sitemap Generator Backend

This is the backend API for the Sitemap Generator application.

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. The API will be available at http://localhost:3000

## Deployment on Render

### Manual Deployment

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - **Name**: sitemap-generator-backend (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
4. Add the following environment variables:
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: Your frontend URL (e.g., `https://your-frontend-app.onrender.com`)

### Using render.yaml

If you prefer to use Infrastructure as Code:

1. Push your code to GitHub
2. In Render dashboard, go to "Blueprints"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file and create the services

## API Endpoints

- `GET /`: API information
- `GET /health`: Health check endpoint
- `POST /generate`: Generate a sitemap
  - Request body:
    ```json
    {
      "url": "example.com",
      "maxPages": 50,
      "includeImages": "on"
    }
    ```
  - Response:
    ```json
    {
      "xml": "...",
      "count": 10,
      "domain": "example.com"
    }
    ```

## Environment Variables

- `PORT`: The port on which the server will run (default: 3000)
- `FRONTEND_URL`: The URL of the frontend application (for CORS) 