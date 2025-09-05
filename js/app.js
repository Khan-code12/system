// Global variables
let currentUser = null;
let token = null;
let categories = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    setupFormHandlers();
    
    // Prevent autocomplete
    setTimeout(() => {
        document.querySelectorAll('input').forEach(input => {
            input.setAttribute('autocomplete', 'off');
        });
    }, 100);
});

// Tab management
function showTab(tabName) {
    // Hide all content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected content and activate tab
    const contentElement = document.getElementById(tabName + 'Content');
    const tabElement = document.getElementById(tabName + 'Tab');
    
    if (contentElement) contentElement.classList.remove('hidden');
    if (tabElement) tabElement.classList.add('active');
    
    // Load data based on tab
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'complaints':
            loadComplaints();
            break;
        case 'admin':
            loadAllComplaints();
            break;
        case 'technician':
            loadTechnicianComplaints();
            break;
    }
}

// Show user interface after login
function showUserInterface() {
    if (!currentUser) return;
    
    document.getElementById('userInfo').classList.remove('hidden');
    document.getElementById('userName').textContent = currentUser.full_name;
    document.getElementById('userRole').textContent = currentUser.role;
    
    // Show appropriate tabs based on role
    document.getElementById('dashboardTab').classList.remove('hidden');
    document.getElementById('complaintsTab').classList.remove('hidden');
    document.getElementById('submitTab').classList.remove('hidden');
    
    if (currentUser.role === 'admin') {
        document.getElementById('adminTab').classList.remove('hidden');
    }
    
    if (currentUser.role === 'technician') {
        document.getElementById('technicianTab').classList.remove('hidden');
    }
    
    // Hide login/register tabs
    document.getElementById('loginTab').classList.add('hidden');
    document.getElementById('registerTab').classList.add('hidden');
    
    showTab('dashboard');
}

// Logout function
function logout() {
    token = null;
    currentUser = null;
    
    // Hide user interface
    document.getElementById('userInfo').classList.add('hidden');
    document.querySelectorAll('.nav-tab:not(#loginTab):not(#registerTab)').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Show login/register tabs
    document.getElementById('loginTab').classList.remove('hidden');
    document.getElementById('registerTab').classList.remove('hidden');
    
    // Clear forms
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    
    // Clear alerts
    clearAlerts();
    
    showTab('login');
}

// Setup form handlers
function setupFormHandlers() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            email: document.getElementById('loginEmail').value,
            password: document.getElementById('loginPassword').value
        };
        
        try {
            const response = await fetch('api/auth.php?action=login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                token = data.token;
                currentUser = data.user;
                showUserInterface();
                showAlert('loginAlert', 'Login successful!', 'success');
            } else {
                showAlert('loginAlert', data.error, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('loginAlert', 'Login failed. Please try again.', 'error');
        }
    });

    // Register form
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            full_name: document.getElementById('regFullName').value,
            username: document.getElementById('regUsername').value,
            email: document.getElementById('regEmail').value,
            password: document.getElementById('regPassword').value,
            department: document.getElementById('regDepartment').value,
            phone: document.getElementById('regPhone').value
        };
        
        try {
            const response = await fetch('api/auth.php?action=register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                token = data.token;
                currentUser = data.user;
                showUserInterface();
                showAlert('registerAlert', 'Registration successful!', 'success');
            } else {
                showAlert('registerAlert', data.error, 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showAlert('registerAlert', 'Registration failed. Please try again.', 'error');
        }
    });

    // Complaint form
    document.getElementById('complaintForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('complaintTitle').value,
            category_id: document.getElementById('complaintCategory').value,
            priority: document.getElementById('complaintPriority').value,
            location: document.getElementById('complaintLocation').value,
            description: document.getElementById('complaintDescription').value
        };
        
        try {
            const response = await fetch('api/complaints.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAlert('submitAlert', 'Complaint submitted successfully!', 'success');
                document.getElementById('complaintForm').reset();
                loadDashboard(); // Refresh dashboard
            } else {
                showAlert('submitAlert', data.error || 'Failed to submit complaint', 'error');
            }
        } catch (error) {
            console.error('Submit error:', error);
            showAlert('submitAlert', 'Failed to submit complaint. Please try again.', 'error');
        }
    });
}

// Load categories
async function loadCategories() {
    try {
        const response = await fetch('api/categories.php');
        const data = await response.json();
        
        if (data.categories) {
            categories = data.categories;
            
            // Populate category dropdowns
            const categorySelect = document.getElementById('complaintCategory');
            const filterCategory = document.getElementById('filterCategory');
            
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Select Category</option>';
                data.categories.forEach(category => {
                    categorySelect.innerHTML += `<option value="${category.id}">${category.name}</option>`;
                });
            }
            
            if (filterCategory) {
                filterCategory.innerHTML = '<option value="">All Categories</option>';
                data.categories.forEach(category => {
                    filterCategory.innerHTML += `<option value="${category.id}">${category.name}</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

// Load dashboard data
async function loadDashboard() {
    if (!currentUser || !token) return;
    
    try {
        const response = await fetch('api/dashboard.php', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        const data = await response.json();
        
        if (data.stats) {
            const stats = data.stats;
            
            // Update statistics
            document.getElementById('totalComplaints').textContent = stats.total_complaints || 0;
            document.getElementById('openComplaints').textContent = stats.open_complaints || 0;
            document.getElementById('resolvedComplaints').textContent = stats.resolved_complaints || 0;
            document.getElementById('avgResolutionTime').textContent = stats.avg_resolution_time || 0;
            
            // Show recent complaints
            const recentList = document.getElementById('recentComplaintsList');
            if (recentList) {
                recentList.innerHTML = '';
                
                if (stats.recent_complaints && stats.recent_complaints.length > 0) {
                    stats.recent_complaints.forEach(complaint => {
                        recentList.innerHTML += createComplaintCard(complaint);
                    });
                } else {
                    recentList.innerHTML = '<p>No recent complaints found.</p>';
                }
            }
        }
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

// Load user complaints
async function loadComplaints() {
    if (!currentUser || !token) return;
    
    const statusFilter = document.getElementById('filterStatus').value;
    const categoryFilter = document.getElementById('filterCategory').value;
    
    let url = 'api/complaints.php?';
    const params = [];
    if (statusFilter) params.push(`status=${statusFilter}`);
    if (categoryFilter) params.push(`category=${categoryFilter}`);
    url += params.join('&');
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        const data = await response.json();
        
        if (data.complaints) {
            const complaintsList = document.getElementById('complaintsList');
            complaintsList.innerHTML = '';
            
            if (data.complaints.length === 0) {
                complaintsList.innerHTML = '<p>No complaints found.</p>';
            } else {
                data.complaints.forEach(complaint => {
                    complaintsList.innerHTML += createComplaintCard(complaint, true);
                });
            }
        }
    } catch (error) {
        console.error('Failed to load complaints:', error);
    }
}

// Load all complaints (admin)
async function loadAllComplaints() {
    if (!currentUser || !token || currentUser.role !== 'admin') return;
    
    const statusFilter = document.getElementById('adminFilterStatus').value;
    
    let url = 'api/complaints.php?';
    if (statusFilter) url += `status=${statusFilter}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        const data = await response.json();
        
        if (data.complaints) {
            const complaintsList = document.getElementById('adminComplaintsList');
            complaintsList.innerHTML = '';
            
            if (data.complaints.length === 0) {
                complaintsList.innerHTML = '<p>No complaints found.</p>';
            } else {
                data.complaints.forEach(complaint => {
                    complaintsList.innerHTML += createAdminComplaintCard(complaint);
                });
            }
        }
    } catch (error) {
        console.error('Failed to load complaints:', error);
    }
}

// Load technician complaints
async function loadTechnicianComplaints() {
    if (!currentUser || !token || currentUser.role !== 'technician') return;
    
    try {
        const response = await fetch('api/complaints.php', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        const data = await response.json();
        
        if (data.complaints) {
            const complaintsList = document.getElementById('technicianComplaintsList');
            complaintsList.innerHTML = '';
            
            if (data.complaints.length === 0) {
                complaintsList.innerHTML = '<p>No assigned complaints found.</p>';
            } else {
                data.complaints.forEach(complaint => {
                    complaintsList.innerHTML += createTechnicianComplaintCard(complaint);
                });
            }
        }
    } catch (error) {
        console.error('Failed to load complaints:', error);
    }
}

// Create complaint card HTML
function createComplaintCard(complaint, showActions = false) {
    const statusClass = `status-${complaint.status}`;
    const priorityClass = `priority-${complaint.priority}`;
    
    return `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div style="flex: 1;">
                    <h4 style="margin-bottom: 5px;">${complaint.title}</h4>
                    <p style="color: #718096; font-size: 14px;">
                        ID: #${complaint.id} | ${complaint.category_name} | ${complaint.user_name || currentUser.full_name} | ${new Date(complaint.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span class="status-badge ${statusClass}">${complaint.status.replace('_', ' ')}</span>
                    <span class="priority-badge ${priorityClass}">${complaint.priority}</span>
                </div>
            </div>
            <p style="margin-bottom: 15px; color: #4a5568;">${complaint.description.substring(0, 150)}${complaint.description.length > 150 ? '...' : ''}</p>
            ${complaint.location ? `<p style="margin-bottom: 15px; color: #718096;"><strong>Location:</strong> ${complaint.location}</p>` : ''}
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn btn-secondary" onclick="viewComplaint(${complaint.id})">View Details</button>
                ${showActions ? `<button class="btn" onclick="editComplaint(${complaint.id})">Edit</button>` : ''}
            </div>
        </div>
    `;
}

// Create admin complaint card
function createAdminComplaintCard(complaint) {
    const statusClass = `status-${complaint.status}`;
    const priorityClass = `priority-${complaint.priority}`;
    
    return `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div style="flex: 1;">
                    <h4 style="margin-bottom: 5px;">${complaint.title}</h4>
                    <p style="color: #718096; font-size: 14px;">
                        ID: #${complaint.id} | ${complaint.category_name} | ${complaint.user_name} | ${new Date(complaint.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span class="status-badge ${statusClass}">${complaint.status.replace('_', ' ')}</span>
                    <span class="priority-badge ${priorityClass}">${complaint.priority}</span>
                </div>
            </div>
            <p style="margin-bottom: 15px; color: #4a5568;">${complaint.description.substring(0, 150)}${complaint.description.length > 150 ? '...' : ''}</p>
            ${complaint.location ? `<p style="margin-bottom: 15px; color: #718096;"><strong>Location:</strong> ${complaint.location}</p>` : ''}
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn btn-secondary" onclick="viewComplaint(${complaint.id})">View Details</button>
                <button class="btn" onclick="assignTechnician(${complaint.id})">Assign Technician</button>
                <select onchange="updateComplaintStatus(${complaint.id}, this.value)" style="padding: 8px; border-radius: 5px; border: 1px solid #e2e8f0;">
                    <option value="">Change Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>
        </div>
    `;
}

// Create technician complaint card
function createTechnicianComplaintCard(complaint) {
    const statusClass = `status-${complaint.status}`;
    const priorityClass = `priority-${complaint.priority}`;
    
    return `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div style="flex: 1;">
                    <h4 style="margin-bottom: 5px;">${complaint.title}</h4>
                    <p style="color: #718096; font-size: 14px;">
                        ID: #${complaint.id} | ${complaint.category_name} | ${complaint.user_name} | ${new Date(complaint.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span class="status-badge ${statusClass}">${complaint.status.replace('_', ' ')}</span>
                    <span class="priority-badge ${priorityClass}">${complaint.priority}</span>
                </div>
            </div>
            <p style="margin-bottom: 15px; color: #4a5568;">${complaint.description.substring(0, 150)}${complaint.description.length > 150 ? '...' : ''}</p>
            ${complaint.location ? `<p style="margin-bottom: 15px; color: #718096;"><strong>Location:</strong> ${complaint.location}</p>` : ''}
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn btn-secondary" onclick="viewComplaint(${complaint.id})">View Details</button>
                <button class="btn btn-success" onclick="updateComplaintStatus(${complaint.id}, 'in_progress')">Start Work</button>
                <button class="btn btn-success" onclick="updateComplaintStatus(${complaint.id}, 'resolved')">Mark Resolved</button>
            </div>
        </div>
    `;
}

// Modal functions
async function viewComplaint(complaintId) {
    try {
        const response = await fetch(`api/complaints.php?id=${complaintId}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        const data = await response.json();
        
        if (data.complaint) {
            showComplaintModal(data.complaint);
        } else {
            alert('Failed to load complaint details');
        }
    } catch (error) {
        console.error('Error loading complaint:', error);
        alert('Error loading complaint details');
    }
}

function showComplaintModal(complaint) {
    const modal = document.getElementById('complaintModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h4>${complaint.title}</h4>
            <div style="display: flex; gap: 10px; margin: 10px 0;">
                <span class="status-badge status-${complaint.status}">${complaint.status.replace('_', ' ')}</span>
                <span class="priority-badge priority-${complaint.priority}">${complaint.priority}</span>
            </div>
        </div>
        
        <div style="margin-bottom: 15px;">
            <strong>Category:</strong> ${complaint.category_name}
        </div>
        
        <div style="margin-bottom: 15px;">
            <strong>Submitted by:</strong> ${complaint.user_name} (${complaint.user_email})
        </div>
        
        ${complaint.location ? `<div style="margin-bottom: 15px;"><strong>Location:</strong> ${complaint.location}</div>` : ''}
        
        ${complaint.technician_name ? `<div style="margin-bottom: 15px;"><strong>Assigned to:</strong> ${complaint.technician_name}</div>` : ''}
        
        <div style="margin-bottom: 15px;">
            <strong>Submitted:</strong> ${new Date(complaint.created_at).toLocaleString()}
        </div>
        
        <div style="margin-bottom: 20px;">
            <strong>Description:</strong>
            <p style="margin-top: 10px; padding: 15px; background: #f7fafc; border-radius: 8px;">${complaint.description}</p>
        </div>
        
        ${complaint.history && complaint.history.length > 0 ? `
            <div>
                <strong>History:</strong>
                <div style="margin-top: 10px;">
                    ${complaint.history.map(h => `
                        <div class="history-item">
                            <div style="font-weight: 500;">Status: ${h.new_status.replace('_', ' ')}</div>
                            <div style="color: #718096; font-size: 14px;">${h.comments || 'No comments'}</div>
                            <div class="history-date">by ${h.changed_by_name} on ${new Date(h.changed_at).toLocaleString()}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('complaintModal').classList.add('hidden');
}

// Update complaint status
async function updateComplaintStatus(complaintId, status) {
    if (!status) return;
    
    try {
        const response = await fetch(`api/complaints.php?id=${complaintId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                status: status,
                comments: `Status changed to ${status.replace('_', ' ')}`
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Refresh current view
            if (currentUser.role === 'admin') {
                loadAllComplaints();
            } else if (currentUser.role === 'technician') {
                loadTechnicianComplaints();
            } else {
                loadComplaints();
            }
            loadDashboard();
        } else {
            alert('Failed to update status: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error updating status');
    }
}

// Assign technician (admin only)
async function assignTechnician(complaintId) {
    if (currentUser.role !== 'admin') return;
    
    try {
        // First, get list of available technicians
        const techResponse = await fetch('api/admin.php?action=technicians', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        const techData = await techResponse.json();
        
        if (techData.technicians && techData.technicians.length > 0) {
            // Create a simple selection prompt
            let options = 'Available Technicians:\n';
            techData.technicians.forEach(tech => {
                options += `${tech.id}: ${tech.full_name} (${tech.department || 'No Department'})\n`;
            });
            
            const technicianId = prompt(options + '\nEnter Technician ID:');
            if (!technicianId) return;
            
            // Assign technician
            const response = await fetch('api/admin.php?action=assign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    complaint_id: complaintId,
                    technician_id: parseInt(technicianId)
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Technician assigned successfully!');
                loadAllComplaints();
                loadDashboard();
            } else {
                alert('Failed to assign technician: ' + (data.error || 'Unknown error'));
            }
        } else {
            alert('No technicians available');
        }
    } catch (error) {
        console.error('Error loading technicians:', error);
        alert('Error loading technicians');
    }
}

// Edit complaint (placeholder function)
function editComplaint(complaintId) {
    alert('Edit functionality not implemented yet');
}

// Utility functions
function showAlert(elementId, message, type) {
    const alertElement = document.getElementById(elementId);
    if (alertElement) {
        alertElement.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        
        setTimeout(() => {
            alertElement.innerHTML = '';
        }, 5000);
    }
}

function clearAlerts() {
    ['loginAlert', 'registerAlert', 'submitAlert'].forEach(alertId => {
        const element = document.getElementById(alertId);
        if (element) element.innerHTML = '';
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('complaintModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Prevent form auto-submission on Enter key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.type !== 'submit' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
    }
});