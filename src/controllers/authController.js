/**
 * Controller handling GitLab OAuth 2.0 authentication flows.
 */
export const authController = {
  /**
   * Redirects the user to the GitLab OAuth authorization page.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  login (req, res) {
    const appId = process.env.GITLAB_APP_ID
    const redirectUri = encodeURIComponent(process.env.GITLAB_CALLBACK_URL)
    const url = `https://gitlab.lnu.se/oauth/authorize?client_id=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=api read_user`

    res.redirect(url)
  },

  /**
   * Handles the OAuth callback from GitLab, exchanges the authorization code for an access token,
   * and stores it securely in the user's session.
   * @param {object} req - Express request object containing the query code.
   * @param {object} res - Express response object.
   * @returns {Promise<void>} Redirects the user to the dashboard on success.
   */
  async callback (req, res) {
    const { code } = req.query

    if (!code) {
      return res.status(400).send('Authorization code missing from GitLab.')
    }

    try {
      const tokenResponse = await fetch('https://gitlab.lnu.se/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.GITLAB_APP_ID,
          client_secret: process.env.GITLAB_APP_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.GITLAB_CALLBACK_URL
        })
      })

      const tokenData = await tokenResponse.json()

      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || 'Failed to fetch access token')
      }

      // Save user-specific token
      req.session.access_token = tokenData.access_token
      res.redirect('/')
    } catch (error) {
      console.error('OAuth Callback Error:', error)
      res.status(500).send('Authentication failed. Check terminal for details.')
    }
  },

  /**
   * Destroys the current user session and redirects to the login screen.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  logout (req, res) {
    req.session.destroy(() => {
      res.redirect('/')
    })
  }
}
