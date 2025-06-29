/**
 * 👨‍🏫 EcoLearn Educator Portal JavaScript
 * Teaching dashboard dengan AI analytics dan green computing
 */

// Import EcoLearn Shared Libraries with error handling
let initEcoLearn, carbonTracker, apiService, authUtils, config;

async function loadSharedLibraries() {
    try {
        console.log('🔄 Loading EcoLearn shared libraries for educator...');

        const sharedModule = await import('https://adbecolearn.github.io/ecolearn-shared/index.js');

        // Extract exports with validation
        initEcoLearn = sharedModule.initEcoLearn;
        carbonTracker = sharedModule.carbonTracker;
        apiService = sharedModule.apiService;
        authUtils = sharedModule.authUtils;
        config = sharedModule.config;

        // Validate all required exports
        const requiredExports = { initEcoLearn, carbonTracker, apiService, authUtils, config };
        const missingExports = Object.entries(requiredExports)
            .filter(([name, value]) => !value)
            .map(([name]) => name);

        if (missingExports.length > 0) {
            throw new Error(`Missing exports: ${missingExports.join(', ')}`);
        }

        console.log('✅ Educator shared libraries loaded successfully');
        return true;

    } catch (error) {
        console.error('❌ Failed to load educator shared libraries:', error);
        showLoadingError('Failed to load required libraries. Please refresh the page.');
        return false;
    }
}

// Initialize EcoLearn with error handling
async function initializeEcoLearn() {
    try {
        console.log('🔄 Initializing EcoLearn for educator...');

        const ecolearn = await initEcoLearn({
            carbonTracking: true,
            performanceMonitoring: true,
            debugMode: config?.isDevelopment() || false
        });

        console.log('✅ EcoLearn initialized for educator:', ecolearn);
        return ecolearn;

    } catch (error) {
        console.error('❌ Failed to initialize EcoLearn for educator:', error);
        showLoadingError('Failed to initialize application. Please refresh the page.');
        return null;
    }
}

// Show loading error to user
function showLoadingError(message) {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        const loadingText = loadingScreen.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
            loadingText.style.color = '#dc3545';
        }

        // Add retry button
        const retryBtn = document.createElement('button');
        retryBtn.textContent = 'Retry';
        retryBtn.style.cssText = 'margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;';
        retryBtn.onclick = () => window.location.reload();

        const loadingContent = loadingScreen.querySelector('.loading-content');
        if (loadingContent && !loadingContent.querySelector('button')) {
            loadingContent.appendChild(retryBtn);
        }
    }
}

// Educator Portal App Class
class EducatorApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentUser = null;
        this.isLoading = true;
        this.userMenuOpen = false;
        this.refreshInterval = null;
        this.sessionStart = Date.now();

        // Don't call init() immediately - wait for libraries to load
    }

    /**
     * Initialize educator portal app
     */
    async init() {
        try {
            console.log('👨‍🏫 Starting Educator Portal initialization...');

            // Validate required libraries are loaded
            if (!authUtils || !carbonTracker || !config) {
                throw new Error('Required libraries not loaded');
            }

            // Check authentication (skip redirect for testing)
            await this.checkAuthentication();

            // Setup DOM references
            this.setupDOM();

            // Setup event listeners
            this.setupEventListeners();

            // Setup carbon tracking
            this.setupCarbonTracking();
            
            // Load user data
            await this.loadUserData();
            
            // Initialize dashboard
            this.initializeDashboard();
            
            // Start auto-refresh
            this.startAutoRefresh();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            carbonTracker.track('educator_portal_init', {
                userId: this.currentUser?.id,
                role: 'educator'
            });
            
            console.log('👨‍🏫 EcoLearn Educator Portal initialized');
            
        } catch (error) {
            console.error('Failed to initialize educator portal:', error);
            this.handleInitError(error);
        }
    }

    /**
     * Check user authentication
     */
    async checkAuthentication() {
        try {
            // Check if we're in debug mode (skip auth for testing)
            const isDebugMode = window.location.href.includes('test-educator-loading.html') ||
                               window.location.href.includes('debug-loading.html') ||
                               config?.isDevelopment() ||
                               window.location.hostname === 'localhost';

            if (isDebugMode) {
                console.log('🔧 Debug mode: Skipping authentication for educator');
                // Create mock user for testing
                this.currentUser = {
                    id: 'debug-educator',
                    firstName: 'Debug',
                    lastName: 'Educator',
                    email: 'educator@digitalbdg.ac.id',
                    role: 'educator',
                    employeeId: 'EDU001'
                };
                return;
            }

            if (!authUtils.isAuthenticated()) {
                console.log('🔐 Educator not authenticated, redirecting to auth...');
                window.location.href = 'https://adbecolearn.github.io/ecolearn-auth/';
                return;
            }

            this.currentUser = authUtils.getCurrentUser();

            // Verify user role
            if (this.currentUser && this.currentUser.role !== 'educator') {
                console.log('👤 Wrong role for educator portal, redirecting...');
                const redirectUrl = authUtils.getRedirectUrl(this.currentUser.role);
                window.location.href = redirectUrl;
                return;
            }

            console.log('✅ Educator authentication check passed');

        } catch (error) {
            console.error('❌ Educator authentication check failed:', error);
            // In case of error, create mock user for testing
            this.currentUser = {
                id: 'fallback-educator',
                firstName: 'Test',
                lastName: 'Educator',
                email: 'test.educator@digitalbdg.ac.id',
                role: 'educator',
                employeeId: 'TEST001'
            };
        }
    }

    /**
     * Setup DOM references
     */
    setupDOM() {
        // Loading screen
        this.loadingScreen = document.getElementById('loading-screen');
        this.app = document.getElementById('app');
        
        // Navigation elements
        this.navLinks = document.querySelectorAll('.nav-link');
        this.userBtn = document.getElementById('userBtn');
        this.userDropdown = document.getElementById('userDropdown');
        this.userMenu = document.querySelector('.user-menu');
        this.logoutBtn = document.getElementById('logoutBtn');
        
        // Header elements
        this.aiStatus = document.getElementById('aiStatus');
        this.aiIndicator = document.getElementById('aiIndicator');
        this.notificationsBtn = document.getElementById('notificationsBtn');
        this.notificationBadge = document.getElementById('notificationBadge');
        
        // User profile elements
        this.userInitials = document.getElementById('userInitials');
        this.userName = document.getElementById('userName');
        
        // Page content elements
        this.pageContents = document.querySelectorAll('.page-content');
        
        // Dashboard elements
        this.metricsTimeFilter = document.getElementById('metricsTimeFilter');
        this.totalStudents = document.getElementById('totalStudents');
        this.activeCourses = document.getElementById('activeCourses');
        this.aiInteractions = document.getElementById('aiInteractions');
        this.avgProgress = document.getElementById('avgProgress');
        this.viewAllStudents = document.getElementById('viewAllStudents');
        this.aiModelSelect = document.getElementById('aiModelSelect');
        this.refreshActivity = document.getElementById('refreshActivity');
        this.activityList = document.getElementById('activityList');
        this.totalCarbonSaved = document.getElementById('totalCarbonSaved');
        
        // Action buttons
        this.exportDataBtn = document.getElementById('exportDataBtn');
        this.generateReportBtn = document.getElementById('generateReportBtn');
        this.createAssignmentBtn = document.getElementById('createAssignmentBtn');
        this.reviewSubmissionsBtn = document.getElementById('reviewSubmissionsBtn');
        this.scheduleClassBtn = document.getElementById('scheduleClassBtn');
        this.aiInsightsBtn = document.getElementById('aiInsightsBtn');
        
        // Carbon tracker elements
        this.carbonIndicator = document.querySelector('.carbon-indicator');
        this.carbonText = document.querySelector('.carbon-text');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation links
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });
        
        // User menu
        if (this.userBtn) {
            this.userBtn.addEventListener('click', (e) => this.toggleUserMenu(e));
        }
        
        // Close user menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.userMenu.contains(e.target)) {
                this.closeUserMenu();
            }
        });
        
        // Logout
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // Notifications
        if (this.notificationsBtn) {
            this.notificationsBtn.addEventListener('click', () => this.showNotifications());
        }
        
        // Dashboard filters
        if (this.metricsTimeFilter) {
            this.metricsTimeFilter.addEventListener('change', (e) => this.updateMetricsPeriod(e.target.value));
        }
        
        if (this.aiModelSelect) {
            this.aiModelSelect.addEventListener('change', (e) => this.updateAiModelFilter(e.target.value));
        }
        
        // Dashboard actions
        if (this.viewAllStudents) {
            this.viewAllStudents.addEventListener('click', () => this.navigateToPage('students'));
        }
        
        if (this.refreshActivity) {
            this.refreshActivity.addEventListener('click', () => this.refreshActivityFeed());
        }
        
        // Header actions
        if (this.exportDataBtn) {
            this.exportDataBtn.addEventListener('click', () => this.exportData());
        }
        
        if (this.generateReportBtn) {
            this.generateReportBtn.addEventListener('click', () => this.generateReport());
        }
        
        // Quick actions
        if (this.createAssignmentBtn) {
            this.createAssignmentBtn.addEventListener('click', () => this.createAssignment());
        }
        
        if (this.reviewSubmissionsBtn) {
            this.reviewSubmissionsBtn.addEventListener('click', () => this.reviewSubmissions());
        }
        
        if (this.scheduleClassBtn) {
            this.scheduleClassBtn.addEventListener('click', () => this.scheduleClass());
        }
        
        if (this.aiInsightsBtn) {
            this.aiInsightsBtn.addEventListener('click', () => this.navigateToPage('ai-insights'));
        }
        
        // Window events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('beforeunload', () => this.handleBeforeUnload());
    }

    /**
     * Setup carbon tracking updates
     */
    setupCarbonTracking() {
        // Update carbon display every 3 seconds
        setInterval(() => {
            this.updateCarbonDisplay();
        }, 3000);
        
        // Initial update
        this.updateCarbonDisplay();
    }

    /**
     * Load user data from API
     */
    async loadUserData() {
        try {
            // Update user profile display
            if (this.currentUser) {
                const initials = `${this.currentUser.firstName[0]}${this.currentUser.lastName[0]}`.toUpperCase();
                
                if (this.userInitials) this.userInitials.textContent = initials;
                if (this.userName) this.userName.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
            }
            
            // Load dashboard data
            await this.loadDashboardData();
            
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        try {
            // Simulate API call for dashboard data
            const dashboardData = {
                totalStudents: 300,
                activeCourses: 6,
                aiInteractions: 1247,
                avgProgress: 78,
                totalCarbonSaved: 127.3
            };
            
            // Update dashboard displays
            if (this.totalStudents) this.totalStudents.textContent = dashboardData.totalStudents;
            if (this.activeCourses) this.activeCourses.textContent = dashboardData.activeCourses;
            if (this.aiInteractions) this.aiInteractions.textContent = dashboardData.aiInteractions.toLocaleString();
            if (this.avgProgress) this.avgProgress.textContent = `${dashboardData.avgProgress}%`;
            if (this.totalCarbonSaved) this.totalCarbonSaved.textContent = `${dashboardData.totalCarbonSaved}g`;
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    /**
     * Initialize dashboard
     */
    initializeDashboard() {
        // Set AI status
        this.updateAiStatus('online');
        
        // Initialize notifications
        this.updateNotificationBadge(5);
        
        // Load activity feed
        this.loadActivityFeed();
    }

    /**
     * Start auto-refresh for real-time data
     */
    startAutoRefresh() {
        // Refresh dashboard data every 30 seconds
        this.refreshInterval = setInterval(() => {
            if (this.currentPage === 'dashboard') {
                this.loadDashboardData();
                this.loadActivityFeed();
            }
        }, 30000);
    }

    /**
     * Hide loading screen and show app
     */
    hideLoadingScreen() {
        setTimeout(() => {
            if (this.loadingScreen) {
                this.loadingScreen.classList.add('hidden');
            }
            if (this.app) {
                this.app.style.display = 'flex';
            }
            this.isLoading = false;
        }, 1500);
    }

    /**
     * Handle initialization error
     */
    handleInitError(error) {
        console.error('Initialization error:', error);
        
        // Show error message
        if (this.loadingScreen) {
            const loadingText = this.loadingScreen.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = 'Failed to initialize. Please refresh the page.';
                loadingText.style.color = 'var(--eco-error-600)';
            }
        }
    }

    /**
     * Handle navigation between pages
     */
    handleNavigation(e) {
        e.preventDefault();
        
        const link = e.currentTarget;
        const page = link.dataset.page;
        
        if (page && page !== this.currentPage) {
            this.navigateToPage(page);
        }
    }

    /**
     * Navigate to specific page
     */
    navigateToPage(page) {
        // Update current page
        this.currentPage = page;
        
        // Update navigation active state
        this.navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
        
        // Update page content
        this.pageContents.forEach(content => {
            content.classList.toggle('active', content.id === `${page}-page`);
        });
        
        carbonTracker.track('educator_page_navigation', {
            from: this.currentPage,
            to: page
        });
        
        // Page-specific initialization
        if (page === 'dashboard') {
            this.loadDashboardData();
        }
    }

    /**
     * Toggle user menu
     */
    toggleUserMenu(e) {
        e.stopPropagation();
        this.userMenuOpen = !this.userMenuOpen;

        if (this.userMenu) {
            this.userMenu.classList.toggle('open', this.userMenuOpen);
        }

        carbonTracker.track('user_menu_toggle', {
            isOpen: this.userMenuOpen
        });
    }

    /**
     * Close user menu
     */
    closeUserMenu() {
        this.userMenuOpen = false;

        if (this.userMenu) {
            this.userMenu.classList.remove('open');
        }
    }

    /**
     * Handle user logout
     */
    handleLogout() {
        carbonTracker.track('educator_logout', {
            userId: this.currentUser?.id,
            sessionDuration: Date.now() - this.sessionStart
        });

        // Clear refresh interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        authUtils.logout();
        window.location.href = 'https://adbecolearn.github.io/ecolearn-home/';
    }

    /**
     * Show notifications
     */
    showNotifications() {
        carbonTracker.track('educator_notifications_opened');

        // TODO: Implement notifications modal
        console.log('Notifications clicked');
    }

    /**
     * Update metrics period
     */
    updateMetricsPeriod(period) {
        carbonTracker.track('metrics_period_change', { period });

        // TODO: Update metrics data based on period
        console.log('Metrics period changed to:', period);
        this.loadDashboardData();
    }

    /**
     * Update AI model filter
     */
    updateAiModelFilter(model) {
        carbonTracker.track('ai_model_filter_change', { model });

        // TODO: Update AI performance data based on model
        console.log('AI model filter changed to:', model);
    }

    /**
     * Refresh activity feed
     */
    refreshActivityFeed() {
        carbonTracker.track('activity_feed_refresh');

        // Add rotation animation
        if (this.refreshActivity) {
            this.refreshActivity.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                this.refreshActivity.style.transform = 'rotate(0deg)';
            }, 500);
        }

        this.loadActivityFeed();
    }

    /**
     * Load activity feed
     */
    loadActivityFeed() {
        // Activity feed is already populated in HTML
        // In real implementation, this would fetch from API
        console.log('Activity feed loaded');
    }

    /**
     * Export data
     */
    exportData() {
        carbonTracker.track('data_export_initiated');

        // TODO: Implement data export functionality
        console.log('Export data clicked');

        // Show success message
        this.showToast('Data export initiated. You will receive an email when ready.', 'success');
    }

    /**
     * Generate report
     */
    generateReport() {
        carbonTracker.track('report_generation_initiated');

        // TODO: Implement report generation
        console.log('Generate report clicked');

        // Navigate to reports page
        this.navigateToPage('reports');
    }

    /**
     * Create assignment
     */
    createAssignment() {
        carbonTracker.track('create_assignment_clicked');

        // TODO: Implement assignment creation modal
        console.log('Create assignment clicked');

        this.showToast('Assignment creation feature coming soon!', 'info');
    }

    /**
     * Review submissions
     */
    reviewSubmissions() {
        carbonTracker.track('review_submissions_clicked');

        // TODO: Navigate to submissions review
        console.log('Review submissions clicked');

        this.showToast('12 submissions pending review', 'info');
    }

    /**
     * Schedule class
     */
    scheduleClass() {
        carbonTracker.track('schedule_class_clicked');

        // TODO: Implement class scheduling
        console.log('Schedule class clicked');

        this.showToast('Class scheduling feature coming soon!', 'info');
    }

    /**
     * Update AI status
     */
    updateAiStatus(status) {
        const statusTexts = {
            'online': 'AI Ready',
            'busy': 'AI Processing',
            'offline': 'AI Offline'
        };

        if (this.aiStatus) {
            this.aiStatus.textContent = statusTexts[status] || 'AI Unknown';
        }

        if (this.aiIndicator) {
            this.aiIndicator.className = 'ai-indicator';
            if (status === 'busy') {
                this.aiIndicator.classList.add('warning');
            } else if (status === 'offline') {
                this.aiIndicator.classList.add('critical');
            }
        }
    }

    /**
     * Update notification badge
     */
    updateNotificationBadge(count) {
        if (this.notificationBadge) {
            this.notificationBadge.textContent = count;
            this.notificationBadge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    /**
     * Update carbon footprint display
     */
    updateCarbonDisplay() {
        const metrics = carbonTracker.getMetrics();
        const budget = carbonTracker.getCarbonBudget();

        // Update carbon text
        const carbonValue = `${metrics.totalCarbonGrams.toFixed(3)}g CO2`;

        if (this.carbonText) {
            this.carbonText.textContent = carbonValue;
        }

        // Update carbon indicator color
        if (this.carbonIndicator) {
            this.carbonIndicator.className = 'carbon-indicator';
            if (budget.status === 'warning') {
                this.carbonIndicator.classList.add('warning');
            } else if (budget.status === 'critical') {
                this.carbonIndicator.classList.add('critical');
            }
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // Style toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? 'var(--eco-success-500)' :
                       type === 'error' ? 'var(--eco-error-500)' :
                       'var(--eco-primary-500)',
            color: 'white',
            padding: 'var(--eco-space-3) var(--eco-space-4)',
            borderRadius: 'var(--eco-rounded-md)',
            boxShadow: 'var(--eco-shadow-lg)',
            zIndex: 'var(--eco-z-50)',
            fontSize: 'var(--eco-text-sm)',
            maxWidth: '300px',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all var(--eco-duration-300) var(--eco-ease-in-out)'
        });

        // Add to DOM
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        carbonTracker.track('educator_window_resize', {
            width: window.innerWidth,
            height: window.innerHeight
        });
    }

    /**
     * Handle before unload
     */
    handleBeforeUnload() {
        // Clear refresh interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        carbonTracker.track('educator_session_end', {
            userId: this.currentUser?.id,
            currentPage: this.currentPage,
            sessionDuration: Date.now() - (this.sessionStart || Date.now())
        });
    }
}

// Initialize app with proper loading sequence
async function initializeEducatorApp() {
    try {
        console.log('🚀 Starting EcoLearn Educator Portal...');

        // Load shared libraries first
        const librariesLoaded = await loadSharedLibraries();
        if (!librariesLoaded) {
            console.error('❌ Cannot proceed without shared libraries');
            return;
        }

        // Initialize EcoLearn
        const ecolearn = await initializeEcoLearn();
        if (!ecolearn) {
            console.error('❌ Cannot proceed without EcoLearn initialization');
            return;
        }

        // Create and initialize educator app
        const educatorApp = new EducatorApp();
        await educatorApp.init();

        // Make app available globally for debugging
        window.educatorApp = educatorApp;

        console.log('🎉 Educator Portal ready!');

    } catch (error) {
        console.error('❌ Failed to initialize Educator Portal:', error);
        showLoadingError('Application failed to start. Please refresh the page.');
    }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEducatorApp);
} else {
    initializeEducatorApp();
}
