export const authController = {
    // Redirect user to GitLab's login page
    login(req, res) {
        const appId = process.env.GITLAB_APP_ID;
        const redirectUri = encodeURIComponent(process.env.GITLAB_CALLBACK_URL);
        const url = `https://gitlab.lnu.se/oauth/authorize?client_id=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=api read_user`;
        
        res.redirect(url);
    }};