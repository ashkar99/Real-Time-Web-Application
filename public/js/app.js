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
    
    // Inject at the top of the grid
    issueList.insertBefore(node, issueList.firstChild);
}