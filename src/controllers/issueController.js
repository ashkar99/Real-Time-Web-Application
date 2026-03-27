/**
 * Controller handling GitLab issue operations via the REST API.
 */
export const issueController = {
  /**
   * Fetches all project issues from GitLab and renders the main dashboard view.
   * Requires a valid OAuth session token.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {Promise<void>} Renders the index view or redirects on authentication failure.
   */
  async index (req, res) {
    if (!req.session.access_token) {
      return res.render('home/index', { authenticated: false })
    }

    try {
      const projectId = process.env.GITLAB_PROJECT_ID
      const url = `https://gitlab.lnu.se/api/v4/projects/${projectId}/issues?state=all&per_page=100&with_labels_details=true`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${req.session.access_token}`
        }
      })

      // token expired, force re-login
      if (response.status === 401) {
        req.session.destroy()
        return res.redirect('/')
      }

      if (!response.ok) {
        throw new Error(`GitLab API error: ${response.status} ${response.statusText}`)
      }

      const issues = await response.json()

      // Render dashboard with issues data and auth
      res.render('home/index', { authenticated: true, issues })
    } catch (error) {
      console.error('Failed to fetch issues:', error)
      res.status(500).send('Internal Server Error while communicating with GitLab.')
    }
  },

  /**
   * Closes a specific issue in the GitLab repository via the REST API.
   * @param {object} req - Express request object containing the issue IID in params.
   * @param {object} res - Express response object.
   * @returns {Promise<void>} Responds with JSON indicating success or failure.
   */
  async closeIssue (req, res) {
    if (!req.session.access_token) {
      return res.render('home/index', { authenticated: false })
    }

    try {
      const { iid } = req.params // internal ID (iid) for project-specific operations
      const projectId = process.env.GITLAB_PROJECT_ID

      const url = `https://gitlab.lnu.se/api/v4/projects/${projectId}/issues/${iid}?state_event=close`

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${req.session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error(`GitLab API error: ${response.status} ${response.statusText}`)
      }

      // Return a 200 OK status to the client
      res.status(200).json({ message: `Issue #${iid} successfully closed.` })
    } catch (error) {
      console.error('Failed to close issue:', error)
      res.status(500).json({ error: 'Internal Server Error while communicating with GitLab.' })
    }
  },

  /**
   * Creates a new issue in the GitLab repository using data from the front-end form.
   * @param {object} req - Express request object containing title and description in the body.
   * @param {object} res - Express response object.
   * @returns {Promise<void>} Responds with the newly created issue data as JSON.
   */
  async createIssue (req, res) {
    if (!req.session.access_token) {
      return res.render('home/index', { authenticated: false })
    }

    try {
      const { title, description } = req.body

      if (!title) {
        return res.status(400).json({ error: 'Issue title is strictly required.' })
      }

      const projectId = process.env.GITLAB_PROJECT_ID
      const url = `https://gitlab.lnu.se/api/v4/projects/${projectId}/issues`

      // Execute the POST request to GitLab
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${req.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description
        })
      })

      if (!response.ok) {
        throw new Error(`GitLab API error: ${response.status} ${response.statusText}`)
      }

      const newIssue = await response.json()
      res.status(201).json(newIssue)
    } catch (error) {
      console.error('Failed to create issue:', error)
      res.status(500).json({ error: 'Internal Server Error while communicating with GitLab.' })
    }
  },

  /**
   * Reopens a previously closed issue in the GitLab repository via the REST API.
   * @param {object} req - Express request object containing the issue IID in params.
   * @param {object} res - Express response object.
   * @returns {Promise<void>} Responds with JSON indicating success or failure.
   */
  async reopenIssue (req, res) {
    if (!req.session.access_token) {
      return res.render('home/index', { authenticated: false })
    }

    try {
      const { iid } = req.params
      const projectId = process.env.GITLAB_PROJECT_ID

      // The GitLab endpoint to reopen an issue
      const url = `https://gitlab.lnu.se/api/v4/projects/${projectId}/issues/${iid}?state_event=reopen`

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${req.session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error(`GitLab API error: ${response.status} ${response.statusText}`)
      }

      res.status(200).json({ message: `Issue #${iid} successfully reopened.` })
    } catch (error) {
      console.error('Failed to reopen issue:', error)
      res.status(500).json({ error: 'Internal Server Error while communicating with GitLab.' })
    }
  }
}
