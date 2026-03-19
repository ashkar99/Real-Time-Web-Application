export const webhookController = {
    // Security Middleware
    verifyToken(req, res, next) {
        // GitLab sends the secret in the x-gitlab-token header
        if (req.headers['x-gitlab-token'] !== process.env.WEBHOOK_SECRET) {
            console.warn('Security Alert: Invalid webhook token received.');
            return res.status(401).send('Unauthorized: Invalid Token');
        }
        next();
    },

    handleWebhook(req, res) {
        res.status(200).send('Webhook acknowledged.');

        const payload = req.body;
        let data = null;
        
        // Issue Events
        if (payload.object_kind === 'issue') {
            data = JSON.stringify({
                type: 'issue_event',
                payload: payload
            });
        } 
        // Push (Commit) Events
        else if (payload.object_kind === 'push') {
            data = JSON.stringify({
                type: 'push_event',
                payload: {
                    user: payload.user_name,
                    commits: payload.total_commits_count,
                    branch: payload.ref.replace('refs/heads/', '')
                }
            });
        }

        // Broadcast if data was constructed
        if (data) {
            res.wss.clients.forEach((client) => {
                if (client.readyState === 1) { // WebSocket.OPEN
                    client.send(data);
                }
            });
        }
    }
};