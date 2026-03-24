export const authController = {
    // Redirect user to GitLab's login page
    login(req, res) {
        const appId = process.env.GITLAB_APP_ID;
        const redirectUri = encodeURIComponent(process.env.GITLAB_CALLBACK_URL);
        const url = `https://gitlab.lnu.se/oauth/authorize?client_id=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=api read_user`;
        
        res.redirect(url);
    },

    // Receive the authorization code from GitLab and exchange it for a token
    async callback(req, res) {
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).send('Authorization code missing from GitLab.');
        }

        try {
            const tokenResponse = await fetch('https://gitlab.lnu.se/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: process.env.GITLAB_APP_ID,
                    client_secret: process.env.GITLAB_APP_SECRET,
                    code: code,
                    grant_type: 'authorization_code',
                    redirect_uri: process.env.GITLAB_CALLBACK_URL
                })
            });

            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok) {
                throw new Error(tokenData.error_description || 'Failed to fetch access token');
            }

            // Save user-specific token
            req.session.access_token = tokenData.access_token;
            res.redirect('/');

        } catch (error) {
            console.error('OAuth Callback Error:', error);
            res.status(500).send('Authentication failed. Check terminal for details.');
        }
    },

    // Destroy the session
    logout(req, res) {
        req.session.destroy(() => {
            res.redirect('/');
        });
    }
};