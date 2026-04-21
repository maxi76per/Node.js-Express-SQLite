document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('search-form');
    const usernameInput = document.getElementById('username');
    const modeToggle = document.getElementById('mode-toggle');
    const labelVulnerable = document.getElementById('label-vulnerable');
    const labelSecure = document.getElementById('label-secure');
    const modeIndicator = document.getElementById('mode-indicator');
    const resultsBody = document.getElementById('results-body');
    const resultCount = document.getElementById('result-count');
    const errorMessage = document.getElementById('error-message');
    const payloadBtns = document.querySelectorAll('.payload-btn');

    let isSecureMode = false;

    // Toggle Mode
    modeToggle.addEventListener('change', (e) => {
        isSecureMode = e.target.checked;
        if (isSecureMode) {
            labelSecure.style.color = 'var(--success)';
            labelVulnerable.style.color = 'var(--text-muted)';
            modeIndicator.innerHTML = `Current Mode: <span class="badge secure-badge">Secure (Parameterized & Validation)</span>`;
            document.body.style.backgroundImage = 'radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(59, 130, 246, 0.1) 0px, transparent 50%)';
        } else {
            labelVulnerable.style.color = 'var(--danger)';
            labelSecure.style.color = 'var(--text-muted)';
            modeIndicator.innerHTML = `Current Mode: <span class="badge vulnerable-badge">Vulnerable (String Concatenation)</span>`;
            document.body.style.backgroundImage = 'radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(239, 68, 68, 0.1) 0px, transparent 50%)';
        }
        
        // Clear results when switching modes
        clearResults();
    });

    // Quick payload buttons
    payloadBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            usernameInput.value = btn.getAttribute('data-payload');
            usernameInput.focus();
        });
    });

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        
        if (!username) {
            showError('Please enter a username.');
            return;
        }

        hideError();
        resultsBody.innerHTML = `<tr><td colspan="4" class="empty-state">Searching...</td></tr>`;

        const endpoint = isSecureMode ? '/api/search/secure' : '/api/search/vulnerable';
        
        try {
            const response = await fetch(`${endpoint}?username=${encodeURIComponent(username)}`);
            const data = await response.json();
            
            if (!response.ok) {
                showError(`Error ${response.status}: ${data.error || 'Unknown error'}`);
                clearResults();
                return;
            }

            renderResults(data);
        } catch (error) {
            showError('Network error occurred while fetching results.');
            clearResults();
        }
    });

    function renderResults(users) {
        resultsBody.innerHTML = '';
        
        if (users.length === 0) {
            resultsBody.innerHTML = `<tr><td colspan="4" class="empty-state">No users found.</td></tr>`;
            resultCount.textContent = `(0 found)`;
            return;
        }

        resultCount.textContent = `(${users.length} found)`;

        users.forEach((user, index) => {
            const tr = document.createElement('tr');
            
            // Adding a slight animation delay for cool effect
            tr.style.animation = `fadeIn 0.3s ease-out forwards`;
            tr.style.animationDelay = `${index * 0.05}s`;
            tr.style.opacity = '0';
            
            tr.innerHTML = `
                <td>${user.id}</td>
                <td><strong>${escapeHTML(user.username)}</strong></td>
                <td style="font-family: monospace; color: #94a3b8;">${escapeHTML(user.password)}</td>
                <td>${user.is_admin ? '<span class="admin-badge">Admin</span>' : 'No'}</td>
            `;
            resultsBody.appendChild(tr);
        });
    }

    function clearResults() {
        resultsBody.innerHTML = `<tr><td colspan="4" class="empty-state">Enter a username to search.</td></tr>`;
        resultCount.textContent = '';
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    // Basic HTML escaping to prevent XSS in our display
    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});

// Add a simple fade-in animation
const style = document.createElement('style');
style.innerHTML = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
