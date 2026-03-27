/**
 * Controller handling incoming GitLab webhooks and WebSocket broadcasting.
 */
export const webhookController = {
  /**
   * Security middleware to verify the authenticity of the incoming GitLab webhook.
   * Checks the 'x-gitlab-token' header against the environment secret.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {object} next - Express next middleware function.
   * @returns {object|void} Returns a 401 response if unauthorized, otherwise calls next().
   */
  verifyToken (req, res, next) {
    if (req.headers['x-gitlab-token'] !== process.env.WEBHOOK_SECRET) {
      console.warn('Security Alert: Invalid webhook token received.')
      return res.status(401).send('Unauthorized: Invalid Token')
    }
    next()
  },

  /**
   * Parses the GitLab webhook payload and broadcasts relevant events to WebSocket clients.
   * @param {object} req - Express request object containing the webhook payload.
   * @param {object} res - Express response object.
   */
  handleWebhook (req, res) {
    res.status(200).send('Webhook acknowledged.')

    const payload = req.body
    let data = null

    if (payload.object_kind === 'issue') {
      const action = payload.object_attributes.action

      if (['open', 'close', 'reopen', 'update'].includes(action)) {
        data = JSON.stringify({
          type: 'issue_event',
          action,
          payload
        })
      } else {
        console.log(`Filtered out issue event with action: ${action}`)
      }
    } else if (payload.object_kind === 'push') { // MOVED THE COMMENT HERE TO FIX THE LINT ERROR
      const userName = payload.user_name || 'A user'
      const commitCount = payload.total_commits_count || 0
      const branch = payload.ref ? payload.ref.replace('refs/heads/', '') : 'unknown'

      console.log(`Received push event from ${userName} on branch ${branch}`)

      data = JSON.stringify({
        type: 'push_event',
        payload: {
          user: userName,
          commits: commitCount,
          branch
        }
      })
    }

    // Broadcast if data was constructed
    if (data) {
      res.wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(data)
        }
      })
    }
  }
}
