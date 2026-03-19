const issueTemplate = document.querySelector('#issue-template');
const issueList = document.querySelector('#issue-list');

// Establish the WebSocket connection
const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const ws = new WebSocket(protocol + window.location.host);

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // Filter for issue events
    if (data.type === 'issue_event') {
        const issue = data.payload.object_attributes;
        insertIssue(issue);
    }
};

function insertIssue(issue) {
    // Clone the template
    const node = issueTemplate.content.cloneNode(true);
    
    // Select the root element and set its ID
    const wrapper = node.querySelector('.issue-node');
    wrapper.id = `issue-${issue.id}`;
    
    // Populate the data fields
    node.querySelector('.issue-title').textContent = `#${issue.iid}: ${issue.title}`;
    node.querySelector('.issue-state').textContent = issue.state;
    node.querySelector('.issue-date').textContent = `Created: ${new Date(issue.created_at).toLocaleDateString()}`;
    node.querySelector('.close-issue-btn').dataset.iid = issue.iid;node.querySelector('.close-issue-btn').dataset.iid = issue.iid;

    // Inject at the top of the grid
    issueList.insertBefore(node, issueList.firstChild);
}

issueList.addEventListener('click', async (event) => {
    // Intercept only clicks on the close button
    if (event.target.classList.contains('close-issue-btn')) {
        const button = event.target;
        const iid = button.dataset.iid;
        
        // Disable button to prevent duplicate clicks
        button.disabled = true;
        button.textContent = 'Closing...';

        try {
            // Dispatch the request to Node.js proxy route
            const response = await fetch(`/issues/${iid}/close`, {
                method: 'POST'
            });

            if (response.ok) {
                const cardNode = button.closest('.issue-node');
                cardNode.remove();
            } else {
                console.error('Server rejected the close request.');
                button.disabled = false;
                button.textContent = 'Close Issue';
            }
        } catch (error) {
            console.error('Network error during close operation:', error);
            button.disabled = false;
            button.textContent = 'Close Issue';
        }
    }
});