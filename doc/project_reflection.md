# Project Reflection & Architecture Document

## Security Implementation (Code and Server)

**In Code:**
To secure the application at the software level, I implemented several defensive measures:
1. **OAuth 2.0 Multi-Tenancy:** I removed the hardcoded Personal Access Token (PAT) and implemented a GitLab OAuth 2.0 flow. Users must explicitly authenticate, and the application acts strictly on their behalf.
2. **Session Security:** OAuth access tokens are stored securely in server-side memory using `express-session`. To protect against Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF), the session cookie is configured with `httpOnly: true` (preventing client-side JavaScript access) and `sameSite: 'lax'`.
3. **Webhook Verification:** To prevent unauthorized entities from sending fake data to the dashboard, the webhook controller enforces a strict security middleware. It validates the `x-gitlab-token` header against a cryptographically strong `WEBHOOK_SECRET` stored in the environment variables.
4. **Route Protection:** Every REST API controller method verifies the existence of `req.session.access_token` before executing, ensuring unauthenticated users cannot interact with the GitLab API.

**On the Application Server:**
* **TLS Encryption:** The server forces HTTPS, ensuring all data transmitted between the client, the server, and the GitLab API (including OAuth tokens and Webhook payloads) is fully encrypted.
* **Environment Segregation:** All sensitive data (Secrets, App IDs) are strictly excluded from version control and reside only in the production server's `.env` file.


## Infrastructure Components
*Describe the following parts, how you are using them, and what their purpose is in your solution:*

### Reversed Proxy (Nginx)
* **How I use it:** The reverse proxy sits at the edge of the server network. It listens for incoming public HTTP/HTTPS traffic (ports 80/443) and forwards it internally to my Node.js application running on port 3000.
* **Purpose:** It serves as a shield for the Node application, handles SSL/TLS termination, and allows multiple applications to potentially run on the same server by routing traffic based on domain names.

### Process Manager (PM2)
* **How I use it:** I use PM2 to launch and manage the `src/server.js` file in the production environment.
* **Purpose:** A Node.js application will terminate if it encounters an unhandled exception or if the SSH session is closed. The process manager ensures the application runs continuously in the background, automatically restarts it if it crashes, and boots it up automatically if the physical server restarts.

### TLS Certificates (Let's Encrypt)
* **How I use it:** TLS certificates are configured on the reverse proxy to enable HTTPS for the domain.
* **Purpose:** TLS provides cryptographic encryption for data in transit. This is strictly required for this application because OAuth 2.0 redirects and Webhook payloads contain highly sensitive data (authorization codes and repository structures) that must not be intercepted via man-in-the-middle attacks.

### Environment Variables
* **How I use it:** I use a `.env` file to store `GITLAB_APP_ID`, `GITLAB_APP_SECRET`, `WEBHOOK_SECRET`, and `SESSION_SECRET`.
* **Purpose:** They physically separate configuration and secrets from the codebase. This prevents sensitive credentials from being leaked if the source code is shared or compromised.


## Development vs. Production Differences

1. **Execution Environment:** In development, the app is run locally on `localhost:3000` using `nodemon`, which automatically restarts the server on file saves. In production, it runs on a public domain (`cscloud...`) managed by a process manager (PM2).
2. **Network Protocol:** Development uses standard unencrypted `http://` and `ws://` protocols. Production enforces encrypted `https://` and `wss://` protocols via the reverse proxy.
3. **OAuth Configuration:** The `GITLAB_CALLBACK_URL` in development points to the localhost endpoint. In production, the GitLab OAuth Application and the `.env` file are updated to point strictly to the production domain.


## Extra Modules Used

1. **`express-session`**
   * **Motivation:** Required to maintain a stateful connection with the user after the OAuth redirect, allowing the server to "remember" the user's specific access token across different page requests.
   * **Security Justification:** It is heavily maintained, and security was ensured by correctly configuring the cookie settings (`httpOnly`, `sameSite`, and a strong `SESSION_SECRET`).
2. **`ws`**
   * **Motivation:** Chosen to build the real-time WebSocket server.
   * **Security Justification:** `ws` is a highly vetted, lightweight, and standard WebSocket implementation for Node.js. It does not contain bloated features, reducing the attack surface.
3. **`dotenv`**
   * **Motivation:** Used to securely load environment variables into `process.env`. 
   * **Security Justification:** Standard industry practice to prevent hardcoding secrets.


## Optional Features Implemented (For Higher Grade)

I implemented several optional features that significantly exceed the baseline requirements of the assignment:

**1. Multi-Tenant GitLab OAuth 2.0 Authentication**
Instead of relying on a single, hardcoded Personal Access Token, the application utilizes the full GitLab OAuth 2.0 protocol. Users authorize the application via the GitLab interface, and the dashboard operates entirely on behalf of the logged-in user, transforming the project into a secure, multi-tenant system.

**2. Rich Web Client with Two-Way Data Binding**
The UI allows users to control issues natively. I engineered asynchronous endpoints (`fetch`) that allow users to create, close, and reopen issues directly from the dashboard. Once the server confirms the action with GitLab, the front-end dynamically updates the DOM and seamlessly animates cards between the "Active" and "Inactive" tabs without reloading the page.

**3. Real-Time Push Event Tracking (Toasts)**
I expanded the webhook interceptor to monitor repository code deployments (`push` events). When a developer pushes code, the WebSocket immediately broadcasts this to the front-end, which triggers an assertive Bootstrap Toast notification detailing the user, the commit count, and the branch.

**4. Native GitLab Data Visualization**
The application achieves visual parity with the native GitLab UI by appending `with_labels_details=true` to API requests. The dashboard extracts the native background hex colors and contrasting text colors from the repository and renders them dynamically. Furthermore, it captures the `closed_by` metadata to historically track exactly which user closed an issue.

**5. Complete LNU Standard Quality Assurance**
The application adheres to 100% compliance with LNU's strict `standard` ESLint rules. Additionally, exhaustive JSDoc comments were written for every controller, module, and front-end function, enabling the automated generation of a professional API documentation website.


## Personal Reflection

**Am I satisfied?**
Yes, highly satisfied. The application operates smoothly, and the architecture feels incredibly robust. Transitioning from a static HTTP request model to a fluid, event-driven WebSocket architecture was challenging but highly rewarding.

**Improvement Areas:**
Currently, `express-session` stores the session data in the server's local memory (`MemoryStore`). This is fine for a single Node instance, but if the server restarts, all logged-in users are forced out. A future improvement would be to integrate a dedicated session store like Redis or MongoDB to ensure sessions persist across deployments and server reboots.

**What I am especially satisfied with:**
I am most proud of successfully implementing the **GitLab OAuth 2.0 multi-tenant flow**. Transitioning the application from using a single, hardcoded token to a secure system where users authenticate with their own personal credentials was hard but incredibly rewarding challenge. Following closely behind that is the **DOM manipulation and real-time state synchronization**. When a user clicks "Close Issue", it is deeply satisfying to watch the card instantly swap its UI badges, dynamically rewrite the "Closed by You" text, and physically move itself to the Inactive tab, perfectly mirroring modern single-page application (SPA) behavior without actually using a massive framework like React.

**TIL for this course part:**
My biggest takeaway for this specific module was production server setup. I learned how to configure HTTPS, set up an Nginx reverse proxy, and integrate REST APIs, Webhooks, and WebSockets into a cohesive, live environment.

**Overall TIL for the entire course:**
Overall, this was a highly important and interesting course that provided a comprehensive overview of web development. Most importantly, it focused on practical, real-world technologies (like REST APIs, OAuth, WebSockets, Databases, and deployment infrastructure) rather than just theoretical assignments designed only to pass a class. These are tangible skills that I will carry forward into my future career.