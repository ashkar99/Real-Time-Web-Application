export const issueController = {
    async index(req, res) {
        try {
            const projectId = process.env.GITLAB_PROJECT_ID;
            const url = `https://gitlab.lnu.se/api/v4/projects/${projectId}/issues?state=opened`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.GITLAB_PERSONAL_ACCESS_TOKEN}`
                }
            });

            if (!response.ok) {
                throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
            }

            const issues = await response.json();
            
            // Pass the issues data to the EJS view
            res.render('home/index', { issues });

        } catch (error) {
            console.error('Failed to fetch issues:', error);
            res.status(500).send('Internal Server Error while communicating with GitLab.');
        }
    },

    async closeIssue(req, res) {
        try {
            const { iid } = req.params; // internal ID (iid) for project-specific operations
            const projectId = process.env.GITLAB_PROJECT_ID;
            
            const url = `https://gitlab.lnu.se/api/v4/projects/${projectId}/issues/${iid}?state_event=close`;

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${process.env.GITLAB_PERSONAL_ACCESS_TOKEN}`
                }
            });

            if (!response.ok) {
                throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
            }

            // Return a 200 OK status to the client
            res.status(200).json({ message: `Issue #${iid} successfully closed.` });

        } catch (error) {
            console.error('Failed to close issue:', error);
            res.status(500).json({ error: 'Internal Server Error while communicating with GitLab.' });
        }
    }
};