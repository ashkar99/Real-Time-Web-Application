const issueTemplate = document.querySelector('#issue-template');
const issueList = document.querySelector('#issue-list');

// Establish the WebSocket connection
const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const ws = new WebSocket(protocol + window.location.host);

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'issue_event') {
        const issue = data.payload.object_attributes;
        const authorName = data.payload.user?.name || 'System User';
        const webhookLabels = data.payload.labels || [];
        insertIssue(issue, authorName, webhookLabels);
    } else if (data.type === 'push_event') {
        showCommitNotification(data.payload);
    }
};

function showCommitNotification(payload) {
    const container = document.getElementById('notification-zone');
    
    // Construct the Toast element
    const toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center text-bg-primary border-0 mb-2';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <strong>Code Push:</strong> ${payload.user} just pushed ${payload.commits} commit(s) to branch '${payload.branch}'.
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `; 
    
    container.appendChild(toastEl);
    
    // Initialize and show the Bootstrap Toast
    const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
    toast.show();
    
    // Clean up DOM after it hides
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

function insertIssue(issue, authorName, webhookLabels = []) {
    const node = issueTemplate.content.cloneNode(true);
    
    const wrapper = node.querySelector('.issue-node');
    wrapper.id = `issue-${issue.id}`;
    
    node.querySelector('.issue-title').textContent = `#${issue.iid}: ${issue.title}`;
    
    // NEW: Inject Native GitLab Colors
    const labelsContainer = node.querySelector('.issue-labels-container');
    if (webhookLabels && webhookLabels.length > 0) {
        webhookLabels.forEach(label => {
            const badge = document.createElement('span');
            badge.className = 'badge rounded-pill border me-1';
            badge.style.backgroundColor = label.color;
            badge.style.color = label.text_color || '#FFFFFF';
            badge.textContent = label.title; 
            labelsContainer.appendChild(badge);
        });
    }
    
    const descEl = node.querySelector('.issue-description');
    const descriptionText = issue.description ? issue.description : '';
    descEl.textContent = descriptionText;
    descEl.title = descriptionText;
    
    node.querySelector('.issue-date-author').innerHTML = `Created by <strong>${authorName}</strong> on ${new Date(issue.created_at).toLocaleDateString()}`;
    const actionBtn = node.querySelector('.action-issue-btn');
    actionBtn.dataset.iid = issue.iid;
    actionBtn.dataset.action = 'close'; 

    const openList = document.getElementById('open-issue-list');
    openList.insertBefore(node, openList.firstChild);
}

document.body.addEventListener('click', async (event) => {
    if (event.target.classList.contains('action-issue-btn')) {
        const button = event.target;
        const iid = button.dataset.iid;
        const action = button.dataset.action; 

        button.disabled = true;
        button.textContent = action === 'close' ? 'Closing...' : 'Reopening...';

        try {
            const response = await fetch(`/issues/${iid}/${action}`, {
                method: 'POST'
            });

            if (response.ok) {
                const cardNode = button.closest('.issue-node');
                const badge = cardNode.querySelector('.issue-state-badge');

                if (action === 'close') {
                    badge.textContent = 'closed';
                    badge.classList.replace('bg-success', 'bg-secondary');
                    button.dataset.action = 'reopen';
                    button.textContent = 'Reopen Issue';
                    button.classList.replace('btn-outline-danger', 'btn-outline-success');

                    // Move to closed list
                    document.getElementById('closed-issue-list').prepend(cardNode);
                } else {
                    badge.textContent = 'opened';
                    badge.classList.replace('bg-secondary', 'bg-success');
                    button.dataset.action = 'close';
                    button.textContent = 'Close Issue';
                    button.classList.replace('btn-outline-success', 'btn-outline-danger');

                    // Move to open list
                    document.getElementById('open-issue-list').prepend(cardNode);
                }
            } else {
                console.error(`Server rejected the ${action} request.`);
                button.textContent = action === 'close' ? 'Close Issue' : 'Reopen Issue';
            }
        } catch (error) {
            console.error(`Network error during ${action} operation:`, error);
            button.textContent = action === 'close' ? 'Close Issue' : 'Reopen Issue';
        } finally {
            button.disabled = false;
        }
    }
});

// Issue Creation Pipeline
const createForm = document.getElementById('create-issue-form');

if (createForm) {
    createForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent standard page reload

        const submitBtn = document.getElementById('submit-issue-btn');
        const titleInput = document.getElementById('issue-title').value;
        const descInput = document.getElementById('issue-desc').value;

        // State lock to prevent duplicate submissions
        submitBtn.disabled = true;
        submitBtn.textContent = 'Deploying...';

        try {
            const response = await fetch('/issues', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    title: titleInput, 
                    description: descInput 
                })
            });

            if (response.ok) {
                // Purge form data and collapse the modal
                createForm.reset();
                const modalElement = document.getElementById('createIssueModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                modalInstance.hide();
            } else {
                console.error('Server rejected the creation payload.');
            }
        } catch (error) {
            console.error('Network integrity failure during creation:', error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Deploy Issue';
        }
    });
}