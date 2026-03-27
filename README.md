# B3 Production Dashboard

A real-time, multi-tenant web client designed to monitor and manage a GitLab repository. Engineered with Node.js, Express, and WebSockets, this dashboard leverages the GitLab REST API and Webhook system to provide seamless, two-way data synchronization without ever reloading the page.

## Core Features

* **Real-Time Data Pipeline:** Utilizes WebSockets and GitLab Webhooks to instantly broadcast repository events (Issue updates, Code Pushes) to all connected clients.
* **Multi-Tenant OAuth 2.0:** Secure, session-based authentication. Users log in via GitLab, and the application strictly operates on behalf of the authenticated user.
* **Rich Interactive Client:** Two-way data binding allows users to natively Create, Close, and Reopen issues directly from the dashboard UI.
* **Native Data Visualization:** Dynamically parses and renders native GitLab label hex colors and historical metadata (e.g., "Closed by [User] on [Date]").
* **Push Event Tracking:** Intercepts repository commits and broadcasts them as non-intrusive, real-time Bootstrap Toast notifications.
* **Enterprise Quality Assurance:** 100% compliant with the `standard` ESLint rulebook and fully documented via JSDoc.

---

## Tech Stack
* **Backend:** Node.js, Express.js, `express-session`, `ws` (WebSockets)
* **Frontend:** HTML5, EJS (Templating), Vanilla JavaScript, Bootstrap 5 (CDN)
* **Integrations:** GitLab REST API v4, GitLab Webhooks, OAuth 2.0
* **Production Infrastructure:** Ubuntu Linux, Nginx (Reverse Proxy), PM2 (Process Manager), Let's Encrypt (TLS/SSL)

---

## Local Development Setup

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **NPM** (Node Package Manager)
* A **GitLab Account** and an active repository.

### 2. Installation
Clone the repository and install the dependencies. *(Note: `--legacy-peer-deps` is required to resolve strict ESLint plugin versioning).*

```bash
git clone https://github.com/ashkar99/Real-Time-Web-Application.git
cd Real-Time-Web-Application
npm install --legacy-peer-deps
```

### 3. GitLab Configuration (OAuth & Webhooks)
Before running the app, you must configure GitLab to communicate with your local server.

**Step A: Create an OAuth Application**
1. In GitLab, navigate to **Edit Profile -> Applications**.
2. Add a new application named `B3 Dashboard (Local)`.
3. Set the **Redirect URI** to: `http://localhost:3000/auth/gitlab/callback`
4. Select the scopes: `api` and `read_user`.
5. Save the **Application ID** and **Secret**.

**Step B: Configure the Webhook**
1. In your GitLab Repository, navigate to **Settings -> Webhooks**.
2. Add a new webhook pointing to: `http://localhost:3000/webhook`
3. Generate a random secret string and paste it into the **Secret token** field.
4. Check the triggers for **Push events** and **Issues events**.
5. Save the webhook.

### 4. Environment Variables
Create a `.env` file in the root directory of the project and populate it with your specific GitLab credentials:

```env
PORT=3000
SESSION_SECRET=your_super_secret_local_string

# GitLab OAuth Credentials
GITLAB_APP_ID=your_oauth_application_id
GITLAB_APP_SECRET=your_oauth_secret
GITLAB_CALLBACK_URL=http://localhost:3000/auth/gitlab/callback

# GitLab Project Data
GITLAB_PROJECT_ID=your_numeric_project_id
WEBHOOK_SECRET=your_random_webhook_secret_string
```

### 5. Running the Application
Start the development server using Nodemon (auto-restarts on file save):
```bash
npm run dev
```
Navigate to `http://localhost:3000` in your browser.

---

## Documentation & Quality Assurance

This project enforces strict LNU standard linting and automated documentation.

**Run the Linter (ESLint + Stylelint + HTMLHint):**
```bash
npm run lint
```

**Generate API Documentation (JSDoc):**
```bash
npm run jsdoc
```
*This command parses the source code and generates a searchable HTML website inside a `docs/webDocs/` folder. Open `docs/webDOcs/index.html` in your browser to view the architecture reference.*

---

## Production Deployment Guide

This application is designed to be deployed on an Ubuntu VPS using PM2 and Nginx.

### 1. Server Preparation
Clone the repository to your server's web directory (e.g., `/var/www/b3-production`), run `npm install --legacy-peer-deps`, and recreate your `.env` file. 
**CRITICAL:** Update your `.env` file, GitLab OAuth App, and GitLab Webhook to point to your public `https://your-domain.com` instead of `localhost`.

### 2. Process Management (PM2)
Daemonize the Node.js application so it runs continuously in the background and survives server restarts:
```bash
sudo npm install -g pm2
pm2 start src/server.js --name b3-dashboard
pm2 save
pm2 startup
```

### 3. Reverse Proxy & WebSocket Configuration (Nginx)
WebSockets require specific HTTP headers to upgrade the connection. Configure your Nginx server block (`/etc/nginx/sites-available/your-domain`) with the following proxy rules:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration (Let's Encrypt / Certbot) goes here...

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket Upgrade Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Standard Forwarding Headers
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Restart Nginx (`sudo systemctl restart nginx`) to apply the changes.

---

## License
This project was developed as an academic assignment for Linnaeus University (LNU) - Web Programming on the Server Side. Standard academic integrity and open-source licensing principles apply.