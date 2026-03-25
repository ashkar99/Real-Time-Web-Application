export const webhookController = {
  // Security Middleware
  verifyToken (req, res, next) {
    // GitLab sends the secret in the x-gitlab-token header
    if (req.headers['x-gitlab-token'] !== process.env.WEBHOOK_SECRET) {
      console.warn('Security Alert: Invalid webhook token received.')
      return res.status(401).send('Unauthorized: Invalid Token')
    }
    next()
  },

  handleWebhook (req, res) {
    res.status(200).send('Webhook acknowledged.')

    const payload = req.body
    let data = null

    // Issue Events
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
    }
    // Push (Commit) Events
    else if (payload.object_kind === 'push') {
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
