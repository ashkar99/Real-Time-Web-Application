# B3 Production Dashboard - Architecture & Feature Documentation

This document outlines the features, architectural decisions, and technical implementations of the B3 Production Dashboard. The application is a real-time, multi-tenant web client designed to monitor and manage a GitLab repository using Node.js, Express, WebSockets, and the GitLab REST/Webhook APIs.

## 1. Multi-Tenant Authentication (GitLab OAuth 2.0)
**What it did:** Transformed the application from a single-user proxy (using a hardcoded personal access token) into a secure, multi-tenant application where users authenticate with their own GitLab credentials.

**How it works:**
* **The Handshake:** When an unauthenticated user arrives, they are prompted to log in. The `authController.login` route redirects them to GitLab's OAuth authorization page.
* **The Token Swap:** Upon approval, GitLab redirects the user back to `/auth/gitlab/callback` with a unique code. The server exchanges this code for a dynamic `access_token`.
* **Session Management:** The token is securely stored in a server-side session (`express-session`), preventing it from being exposed to the client's browser. All subsequent API calls to GitLab act on behalf of the currently logged-in user.

## 2. Real-Time Data Pipeline (Webhooks & WebSockets)
**What it did:** Engineered a one-way real-time data flow from GitLab to the user's browser, eliminating the need for manual page refreshes when repository activity occurs.

**How it works:**
* **The Gatekeeper:** The `webhookController` includes a `verifyToken` middleware that intercepts incoming POST requests from GitLab. It verifies the `x-gitlab-token` against the server's `.env` secret to prevent malicious payload injections.
* **Event Routing:** The controller parses the payload. If it's an `issue` event (open, close, reopen, update) or a `push` event, it stringifies the data and passes it to the WebSocket server.
* **The Broadcast:** The `webSocketServer` iterates through all actively connected browser clients and pushes the data down the open TCP connection.

## 3. Rich Web Client (Two-Way Data Binding)
**What it did:** Built a two-way communication circuit allowing users to Create, Close, and Reopen issues directly from the dashboard interface.

**How it works:**
* **Client-Side Interception:** Instead of using standard HTML forms that force a page reload, `app.js` intercepts button clicks and form submissions using `event.preventDefault()`.
* **Async Operations:** The client sends an asynchronous `fetch` request to the Node.js server (e.g., `POST /issues/:iid/close`).
* **Proxy Execution:** The `issueController` attaches the user's OAuth token and forwards the request to the GitLab REST API. 
* **Optimistic UI Updates:** Once the server confirms the GitLab database was updated, the front-end dynamically moves the issue card to the correct tab (Active/Inactive) without reloading the page.

## 4. Real-Time UI Synchronization
**What it did:** Ensured that if *another* user interacts with the GitLab repository natively, the dashboard updates instantly for everyone else looking at the screen.

**How it works:**
* When the WebSocket receives an `issue_event`, `app.js` reads the `action` type.
* **Open:** Clones a hidden HTML `<template>`, injects the data, and prepends it to the Active Issues list.
* **Close/Reopen:** Locates the specific issue card in the DOM by its ID (`#issue-{id}`), updates its badge color, and dynamically physically moves the DOM node between the "Active" and "Inactive" tabs.
* **Update:** If an issue title, description, or label is edited on GitLab, the script finds the card and seamlessly swaps the text content.

## 5. Push Event Tracking (Toast Notifications)
**What it did:** Expanded the webhook integrations beyond issue tracking to monitor code commits in real-time.

**How it works:**
* When a developer pushes code to the repository, the webhook controller intercepts the `push` event and extracts the username, branch, and total commit count.
* The front-end receives this via WebSocket and triggers `showCommitNotification()`.
* This generates a Bootstrap Toast element—a non-intrusive pop-up in the bottom corner of the screen—alerting the user of the code deployment, which automatically dismisses itself after 5 seconds.

## 6. Premium Data Visualization (Native Labels & Metadata)
**What it did:** Upgraded the visual hierarchy by pulling native styling data directly from the GitLab API.

**How it works:**
* **Native Label Colors:** Instead of hardcoding front-end colors, the server appends `&with_labels_details=true` to the GitLab API fetch. The EJS template reads the native `color` and `text_color` hex codes from the repository and applies them inline to Bootstrap badges, ensuring perfect visual parity with GitLab.
* **"Closed By" Context:** The dashboard parses the `closed_by` and `closed_at` attributes. If an issue is closed, it injects a red timestamp (e.g., *Closed by Zyad Dabbagh on 3/24/2026*). If a user closes it directly from the UI, the DOM instantly renders *Closed by You*.

## 7. Quality Assurance & Documentation
**What it did:** Hardened the codebase to professional enterprise standards.

**How it works:**
* **Strict Linting:** The entire project enforces the `standard` JavaScript rulebook via ESLint, guaranteeing uniform indentation, variable usage, and syntax.
* **Automated JSDocs:** Every major file, controller, and function is documented using strict JSDoc comments (`/** ... */`).