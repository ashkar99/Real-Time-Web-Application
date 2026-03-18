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

    // Webhook Payload Handler
    handleWebhook(req, res) {
        // Acknowledge receipt immediately to prevent GitLab from disabling the hook
        res.status(200).send('Webhook acknowledged.');

        const payload = req.body;
        
        // Only process issue events
        if (payload.object_kind !== 'issue') return;

        console.log(`Received issue event: ${payload.object_attributes.title}`);

        // Broadcast the payload to all connected WebSocket clients
        const data = JSON.stringify({
            type: 'issue_event',
            payload: payload
        });

        res.wss.clients.forEach((client) => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(data);
            }
        });
    }
};