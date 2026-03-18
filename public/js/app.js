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
    const li = node.querySelector('li');
    
    // Populate the template with the new data
    li.id = `issue-${issue.id}`;
    li.innerHTML = `<strong>#${issue.iid}:</strong> ${issue.title} <em>(${issue.state})</em> <span class="badge">NEW</span>`;
    
    // Inject at the top of the list
    issueList.insertBefore(node, issueList.firstChild);
}