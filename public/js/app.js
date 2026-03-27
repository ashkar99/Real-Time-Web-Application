/* global bootstrap */

const issueTemplate = document.querySelector('#issue-template')
const issueList = document.querySelector('#issue-list')

if (issueList) {
  // Establish the WebSocket connection
  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
  const ws = new WebSocket(protocol + window.location.host)

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)

    if (data.type === 'issue_event') {
      const issue = data.payload.object_attributes
      const authorName = data.payload.user?.name || 'System User'
      const webhookLabels = data.payload.labels || []
      const action = data.action

      // Route the data based on the action type
      if (action === 'open') {
        insertIssue(issue, authorName, webhookLabels)
      } else if (action === 'close' || action === 'reopen') {
        updateIssueState(issue.id, action, authorName)
      } else if (action === 'update') {
        updateIssueContent(issue, webhookLabels)
      }
    } else if (data.type === 'push_event') {
      showCommitNotification(data.payload)
    }
  }

  issueList.addEventListener('click', async (event) => {
    if (event.target.classList.contains('action-issue-btn')) {
      const button = event.target
      const iid = button.dataset.iid
      const action = button.dataset.action

      button.disabled = true
      button.textContent = action === 'close' ? 'Closing...' : 'Reopening...'

      try {
        const response = await fetch(`/issues/${iid}/${action}`, {
          method: 'POST'
        })

        if (response.ok) {
          const cardNode = button.closest('.issue-node')
          const badge = cardNode.querySelector('.issue-state-badge')
          const closedBySpan = cardNode.querySelector('.issue-closed-by')

          if (action === 'close') {
            badge.textContent = 'closed'
            badge.classList.replace('bg-success', 'bg-secondary')
            button.dataset.action = 'reopen'
            button.textContent = 'Reopen Issue'
            button.classList.replace('btn-outline-danger', 'btn-outline-success')

            if (closedBySpan) closedBySpan.innerHTML = `Closed by <strong>You</strong> on ${new Date().toLocaleDateString()}`

            document.getElementById('closed-issue-list').prepend(cardNode)
          } else {
            badge.textContent = 'opened'
            badge.classList.replace('bg-secondary', 'bg-success')
            button.dataset.action = 'close'
            button.textContent = 'Close Issue'
            button.classList.replace('btn-outline-success', 'btn-outline-danger')

            if (closedBySpan) closedBySpan.innerHTML = ''

            document.getElementById('open-issue-list').prepend(cardNode)
          }
        } else {
          console.error(`Server rejected the ${action} request.`)
          button.textContent = action === 'close' ? 'Close Issue' : 'Reopen Issue'
        }
      } catch (error) {
        console.error(`Network error during ${action} operation:`, error)
        button.textContent = action === 'close' ? 'Close Issue' : 'Reopen Issue'
      } finally {
        button.disabled = false
      }
    }
  })
}

// Issue Creation Pipeline
const createForm = document.getElementById('create-issue-form')

if (createForm) {
  createForm.addEventListener('submit', async (event) => {
    event.preventDefault() // Prevent standard page reload

    const submitBtn = document.getElementById('submit-issue-btn')
    const titleInput = document.getElementById('issue-title').value
    const descInput = document.getElementById('issue-desc').value

    // State lock to prevent duplicate submissions
    submitBtn.disabled = true
    submitBtn.textContent = 'Deploying...'

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
      })

      if (response.ok) {
        // Purge form data and collapse the modal
        createForm.reset()
        const modalElement = document.getElementById('createIssueModal')
        const modalInstance = bootstrap.Modal.getInstance(modalElement)
        modalInstance.hide()
      } else {
        console.error('Server rejected the creation payload.')
      }
    } catch (error) {
      console.error('Network integrity failure during creation:', error)
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = 'Deploy Issue'
    }
  })
}

/**
 * Displays a Bootstrap Toast notification for code push events
 * @param {object} payload - The payload containing user, commits, and branch information from the push event
 */
function showCommitNotification (payload) {
  const container = document.getElementById('notification-zone')

  // Construct the Toast element
  const toastEl = document.createElement('div')
  toastEl.className = 'toast align-items-center text-bg-primary border-0 mb-2'
  toastEl.setAttribute('role', 'alert')
  toastEl.setAttribute('aria-live', 'assertive')
  toastEl.setAttribute('aria-atomic', 'true')

  toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <strong>Code Push:</strong> ${payload.user} just pushed ${payload.commits} commit(s) to branch '${payload.branch}'.
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `

  container.appendChild(toastEl)

  // Initialize and show the Bootstrap Toast
  const toast = new bootstrap.Toast(toastEl, { delay: 5000 })
  toast.show()

  // Clean up DOM after it hides
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove()
  })
}

/**
 * Inserts a new issue card into the Open Issues list with dynamic content and styling based on GitLab's webhook payload
 * @param {object} issue - The issue object containing details like title, description, creation date, etc.
 * @param {string} authorName - The name of the user who created the issue
 * @param {Array} webhookLabels - An array of labels associated with the issue
 */
function insertIssue (issue, authorName, webhookLabels = []) {
  const node = issueTemplate.content.cloneNode(true)

  const wrapper = node.querySelector('.issue-node')
  wrapper.id = `issue-${issue.id}`

  node.querySelector('.issue-title').textContent = `#${issue.iid}: ${issue.title}`

  // Inject Native GitLab Colors
  const labelsContainer = node.querySelector('.issue-labels-container')
  if (webhookLabels && webhookLabels.length > 0) {
    webhookLabels.forEach(label => {
      const badge = document.createElement('span')
      badge.className = 'badge rounded-pill border me-1'
      badge.style.backgroundColor = label.color
      badge.style.color = label.text_color || '#FFFFFF'
      badge.textContent = label.title
      labelsContainer.appendChild(badge)
    })
  }

  const descEl = node.querySelector('.issue-description')
  const descriptionText = issue.description ? issue.description : ''
  descEl.textContent = descriptionText
  descEl.title = descriptionText

  node.querySelector('.issue-date-author').innerHTML = `Created by <strong>${authorName}</strong> on ${new Date(issue.created_at).toLocaleDateString()}`
  const actionBtn = node.querySelector('.action-issue-btn')
  actionBtn.dataset.iid = issue.iid
  actionBtn.dataset.action = 'close'

  const openList = document.getElementById('open-issue-list')
  openList.insertBefore(node, openList.firstChild)
}

/**
 * Updates the issue card's state (open/closed) and moves it between Open and Closed lists based on the action received from GitLab's webhook
 * @param {number} issueId - The unique identifier of the issue to be updated
 * @param {string} newAction - The new action to be applied to the issue (open/close)
 * @param {string} actionUser - The user who performed the action
 */
function updateIssueState (issueId, newAction, actionUser = 'Unkown') {
  const cardNode = document.getElementById(`issue-${issueId}`)
  if (!cardNode) return

  const badge = cardNode.querySelector('.issue-state-badge')
  const button = cardNode.querySelector('.action-issue-btn')
  const closedBySpan = cardNode.querySelector('.issue-closed-by')

  if (newAction === 'close') {
    badge.textContent = 'closed'
    badge.classList.replace('bg-success', 'bg-secondary')
    if (button) {
      button.dataset.action = 'reopen'
      button.textContent = 'Reopen Issue'
      button.classList.replace('btn-outline-danger', 'btn-outline-success')
    }

    if (closedBySpan) closedBySpan.innerHTML = `Closed by <strong>${actionUser}</strong> on ${new Date().toLocaleDateString()}`

    document.getElementById('closed-issue-list').prepend(cardNode)
  } else if (newAction === 'reopen') {
    badge.textContent = 'opened'
    badge.classList.replace('bg-secondary', 'bg-success')
    if (button) {
      button.dataset.action = 'close'
      button.textContent = 'Close Issue'
      button.classList.replace('btn-outline-success', 'btn-outline-danger')
    }

    if (closedBySpan) closedBySpan.innerHTML = ''

    document.getElementById('open-issue-list').prepend(cardNode)
  }
}

/**
 * Updates the content of an existing issue card with new information
 * @param {object} issue - The issue object containing updated details
 * @param {Array} webhookLabels - An array of labels associated with the issue
 */
function updateIssueContent (issue, webhookLabels) {
  const cardNode = document.getElementById(`issue-${issue.id}`)
  if (!cardNode) return

  cardNode.querySelector('.issue-title').textContent = `#${issue.iid}: ${issue.title}`
  cardNode.querySelector('.issue-title').title = issue.title

  const descEl = cardNode.querySelector('.issue-description')
  const descriptionText = issue.description ? issue.description : 'No description provided.'
  descEl.textContent = descriptionText
  descEl.title = descriptionText

  const labelsContainer = cardNode.querySelector('.issue-labels-container')
  labelsContainer.innerHTML = ''

  if (webhookLabels && webhookLabels.length > 0) {
    webhookLabels.forEach(label => {
      const badge = document.createElement('span')
      badge.className = 'badge rounded-pill border me-1'
      badge.style.backgroundColor = label.color
      badge.style.color = label.text_color || '#FFFFFF'
      badge.textContent = label.title
      labelsContainer.appendChild(badge)
    })
  }
}
