// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initNavigation();
    initScrollAnimations();
    initSyllabusTabs();
    initModal();
    initDownloadPreview();
    initSmoothScrolling();
    initParallaxEffects();
    initCounterAnimations();
    initPythonCompiler();
});

// Navigation functionality
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.querySelector('.navbar');

    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Navbar background on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }
    });

    // Active link highlighting
    window.addEventListener('scroll', function() {
        let current = '';
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Python Compiler (Pyodide)
function initPythonCompiler() {
    const editor = document.getElementById('pythonEditor');
    const output = document.getElementById('pythonOutput');
    const runBtn = document.getElementById('runPython');
    const resetBtn = document.getElementById('resetPython');
    const clearBtn = document.getElementById('clearOutput');
    const statusBadge = document.getElementById('pyStatus');

    if (!editor || !output || !runBtn || !resetBtn || !statusBadge) return;

    let pyodide = null;
    let isLoading = false;

    function setStatus(text, kind = 'info') {
        statusBadge.textContent = text;
        statusBadge.style.background = kind === 'error' ? '#fee2e2' : (kind === 'ready' ? '#dcfce7' : '#eef2ff');
        statusBadge.style.borderColor = kind === 'error' ? '#fecaca' : (kind === 'ready' ? '#bbf7d0' : '#c7d2fe');
    }

    async function loadPyodideOnce() {
        if (pyodide || isLoading) return pyodide;
        if (!window.loadPyodide) {
            setStatus('Pyodide script missing', 'error');
            return null;
        }
        try {
            isLoading = true;
            setStatus('Loading Pyodide...');
            pyodide = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' });
            setStatus('Pyodide: ready', 'ready');
            return pyodide;
        } catch (e) {
            setStatus('Pyodide failed to load', 'error');
            appendLine(String(e), 'stderr');
            return null;
        } finally {
            isLoading = false;
        }
    }

    function appendLine(text, stream = 'stdout') {
        const line = document.createElement('div');
        line.className = stream;
        line.textContent = text;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }

    function captureIO(pyodide) {
        // Redirect Python print and errors to our output
        pyodide.runPython(`
import sys
class _SBOut:
    def write(self, s):
        if s:\n            from js import append_stdout
            append_stdout(str(s))
    def flush(self):
        pass
class _SBErr:
    def write(self, s):
        if s:\n            from js import append_stderr
            append_stderr(str(s))
    def flush(self):
        pass
sys.stdout = _SBOut()
sys.stderr = _SBErr()
`);
    }

    // Expose JS bridges for stdout/stderr
    window.append_stdout = (s) => {
        s.split('\n').forEach(line => { if (line) appendLine(line, 'stdout'); });
    };
    window.append_stderr = (s) => {
        s.split('\n').forEach(line => { if (line) appendLine(line, 'stderr'); });
    };

    runBtn.addEventListener('click', async () => {
        runBtn.disabled = true;
        runBtn.innerHTML = '<span class="loading"></span> Running...';
        try {
            const pyo = await loadPyodideOnce();
            if (!pyo) return;
            captureIO(pyo);
            await pyo.runPythonAsync(editor.value);
        } catch (e) {
            appendLine(String(e), 'stderr');
        } finally {
            runBtn.disabled = false;
            runBtn.innerHTML = '<i class="fas fa-play"></i> Run';
        }
    });

    resetBtn.addEventListener('click', async () => {
        try {
            pyodide = null; // drop reference
            setStatus('Resetting...');
            await loadPyodideOnce();
        } catch (e) {
            appendLine(String(e), 'stderr');
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => { output.innerHTML = ''; });
    }

    // Lazy load pyodide after a short delay to avoid blocking initial paint
    setTimeout(loadPyodideOnce, 600);
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
            }
        });
    }, observerOptions);

    // Observe all elements with data-aos attribute
    document.querySelectorAll('[data-aos]').forEach(el => {
        observer.observe(el);
    });

    // Parallax effect for hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
}

// Syllabus tabs functionality
function initSyllabusTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Modal functionality
function initModal() {
    const modal = document.getElementById('previewModal');
    const closeBtn = document.querySelector('.close');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');

    // Close modal
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
}

// Download and preview functionality
function initDownloadPreview() {
    const previewBtns = document.querySelectorAll('.preview-btn');
    const downloadBtns = document.querySelectorAll('.download-btn');
    const modal = document.getElementById('previewModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');

    // Preview functionality
    previewBtns.forEach(btn => {
        btn.addEventListener('click', function(event) {
            const card = event.currentTarget.closest('.note-card, .question-card');
            const driveId = card ? card.getAttribute('data-drive-id') : null;
            const subject = this.getAttribute('data-subject') || this.getAttribute('data-type');
            showPreview(subject, driveId);
        });
    });

    // Download functionality
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', function(event) {
            const card = event.currentTarget.closest('.note-card, .question-card');
            const driveId = card ? card.getAttribute('data-drive-id') : null;
            const subject = this.getAttribute('data-subject') || this.getAttribute('data-type');
            downloadFile(subject, driveId, event);
        });
    });

    function showPreview(subject, driveId) {
        modalTitle.textContent = `Preview - ${getSubjectName(subject)}`;
        if (driveId) {
            const previewUrl = `https://drive.google.com/file/d/${driveId}/preview`;
            modalContent.innerHTML = `<div class="drive-preview-wrapper"><iframe src="${previewUrl}" allow="autoplay" class="drive-preview-iframe"></iframe></div>`;
        } else {
            modalContent.innerHTML = getPreviewContent(subject);
        }
        modal.style.display = 'block';
    }

    function downloadFile(subject, driveId, event) {
        // Show loading state
        const btn = event.target;
        const originalText = btn.textContent;
        btn.innerHTML = '<span class="loading"></span> Downloading...';
        btn.disabled = true;

        const link = document.createElement('a');
        const href = driveId ? `https://drive.google.com/uc?export=download&id=${driveId}` : getFileUrl(subject);
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Reset button state
        btn.textContent = originalText;
        btn.disabled = false;

        showNotification('Download started', 'success');
    }

    function getSubjectName(subject) {
        const names = {
            'math': 'UNIT -1 Notes',
            'physics': 'UNIT -2  Notes',
            'chemistry': 'UNIT -3 Notes',
            'biology': 'UNIT -4 Notes',
            'unit-5': 'UNIT -5 Notes',
            'math-questions': 'UNIT -1 QB',
            'physics-questions': 'UNIT -2 QB',
            'chemistry-questions': 'UNIT -3 QB',
            'UNIT-4': 'UNIT -4 QB',
            'UNIT-5': 'UNIT -5 QB',
            'lab': 'labmanual'
        };
        return names[subject] || subject;
    }

    function getFileUrl(subject) {
        // Replace with actual file URLs
        const urls = {
            'math': 'https://example.com/files/math-notes.pdf',
            'physics': 'https://example.com/files/physics-notes.pdf',
            'chemistry': 'https://example.com/files/chemistry-notes.pdf',
            'biology': 'https://example.com/files/biology-notes.pdf',
            'math-questions': 'https://example.com/files/math-questions.pdf',
            'physics-questions': 'https://example.com/files/physics-questions.pdf',
            'chemistry-questions': 'https://example.com/files/chemistry-questions.pdf'
        };
        return urls[subject] || '#';
    }

    function getPreviewContent(subject) {
        const content = {
            'math': `
                <div class="preview-content">
                    <h3>Mathematics Study Notes</h3>
                    <div class="preview-section">
                        <h4>Chapter 1: Algebra</h4>
                        <ul>
                            <li>Linear Equations</li>
                            <li>Quadratic Equations</li>
                            <li>Polynomials</li>
                            <li>Factorization</li>
                        </ul>
                    </div>
                    <div class="preview-section">
                        <h4>Chapter 2: Geometry</h4>
                        <ul>
                            <li>Triangles and their properties</li>
                            <li>Circles and tangents</li>
                            <li>Coordinate geometry</li>
                            <li>Trigonometry basics</li>
                        </ul>
                    </div>
                    <p><strong>Total Pages:</strong> 45 pages</p>
                    <p><strong>File Size:</strong> 2.3 MB</p>
                </div>
            `,
            'physics': `
                <div class="preview-content">
                    <h3>Physics Study Notes</h3>
                    <div class="preview-section">
                        <h4>Chapter 1: Mechanics</h4>
                        <ul>
                            <li>Motion in one dimension</li>
                            <li>Laws of motion</li>
                            <li>Work, energy and power</li>
                            <li>Gravitation</li>
                        </ul>
                    </div>
                    <div class="preview-section">
                        <h4>Chapter 2: Thermodynamics</h4>
                        <ul>
                            <li>Heat and temperature</li>
                            <li>Laws of thermodynamics</li>
                            <li>Heat engines</li>
                            <li>Entropy</li>
                        </ul>
                    </div>
                    <p><strong>Total Pages:</strong> 52 pages</p>
                    <p><strong>File Size:</strong> 3.1 MB</p>
                </div>
            `,
            'chemistry': `
                <div class="preview-content">
                    <h3>Chemistry Study Notes</h3>
                    <div class="preview-section">
                        <h4>Chapter 1: Atomic Structure</h4>
                        <ul>
                            <li>Bohr's model</li>
                            <li>Quantum mechanical model</li>
                            <li>Electronic configuration</li>
                            <li>Periodic properties</li>
                        </ul>
                    </div>
                    <div class="preview-section">
                        <h4>Chapter 2: Chemical Bonding</h4>
                        <ul>
                            <li>Ionic bonding</li>
                            <li>Covalent bonding</li>
                            <li>Metallic bonding</li>
                            <li>Intermolecular forces</li>
                        </ul>
                    </div>
                    <p><strong>Total Pages:</strong> 38 pages</p>
                    <p><strong>File Size:</strong> 2.8 MB</p>
                </div>
            `,
            'biology': `
                <div class="preview-content">
                    <h3>Biology Study Notes</h3>
                    <div class="preview-section">
                        <h4>Chapter 1: Cell Biology</h4>
                        <ul>
                            <li>Cell structure and function</li>
                            <li>Cell division</li>
                            <li>Cell organelles</li>
                            <li>Cell membrane transport</li>
                        </ul>
                    </div>
                    <div class="preview-section">
                        <h4>Chapter 2: Genetics</h4>
                        <ul>
                            <li>Mendelian genetics</li>
                            <li>DNA structure and replication</li>
                            <li>Protein synthesis</li>
                            <li>Genetic disorders</li>
                        </ul>
                    </div>
                    <p><strong>Total Pages:</strong> 41 pages</p>
                    <p><strong>File Size:</strong> 2.9 MB</p>
                </div>
            `,
            'math-questions': `
                <div class="preview-content">
                    <h3>Mathematics Question Bank</h3>
                    <div class="preview-section">
                        <h4>Sample Questions:</h4>
                        <div class="question-sample">
                            <p><strong>Q1:</strong> Solve the quadratic equation x² - 5x + 6 = 0</p>
                            <p><strong>Q2:</strong> Find the area of a triangle with sides 3, 4, and 5 units</p>
                            <p><strong>Q3:</strong> Calculate the derivative of f(x) = x³ + 2x² - 5x + 1</p>
                        </div>
                    </div>
                    <p><strong>Total Questions:</strong> 500+</p>
                    <p><strong>Difficulty Levels:</strong> Easy, Medium, Hard</p>
                    <p><strong>File Size:</strong> 4.2 MB</p>
                </div>
            `,
            'physics-questions': `
                <div class="preview-content">
                    <h3>Physics Question Bank</h3>
                    <div class="preview-section">
                        <h4>Sample Questions:</h4>
                        <div class="question-sample">
                            <p><strong>Q1:</strong> A car accelerates from rest at 2 m/s² for 10 seconds. What is its final velocity?</p>
                            <p><strong>Q2:</strong> Calculate the gravitational force between two masses of 5kg and 10kg separated by 2m</p>
                            <p><strong>Q3:</strong> A wave has a frequency of 50Hz and wavelength of 2m. Find its speed</p>
                        </div>
                    </div>
                    <p><strong>Total Questions:</strong> 400+</p>
                    <p><strong>Topics Covered:</strong> Mechanics, Thermodynamics, Waves, Electricity</p>
                    <p><strong>File Size:</strong> 3.8 MB</p>
                </div>
            `,
            'chemistry-questions': `
                <div class="preview-content">
                    <h3>Chemistry Question Bank</h3>
                    <div class="preview-section">
                        <h4>Sample Questions:</h4>
                        <div class="question-sample">
                            <p><strong>Q1:</strong> Balance the chemical equation: H₂ + O₂ → H₂O</p>
                            <p><strong>Q2:</strong> Calculate the molar mass of CaCO₃</p>
                            <p><strong>Q3:</strong> What is the pH of a 0.1M HCl solution?</p>
                        </div>
                    </div>
                    <p><strong>Total Questions:</strong> 350+</p>
                    <p><strong>Topics Covered:</strong> Organic, Inorganic, Physical Chemistry</p>
                    <p><strong>File Size:</strong> 3.2 MB</p>
                </div>
            `
        };
        return content[subject] || '<p>Preview not available for this content.</p>';
    }
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 70; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Parallax effects
function initParallaxEffects() {
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.floating-card');
        
        parallaxElements.forEach((element, index) => {
            const speed = 0.5 + (index * 0.1);
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
}

// Counter animations for statistics
function initCounterAnimations() {
    const counters = document.querySelectorAll('.stat-number');
    const counterObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });

    function animateCounter(element) {
        const target = parseInt(element.textContent.replace(/[^\d]/g, ''));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            const suffix = element.textContent.replace(/[\d]/g, '');
            element.textContent = Math.floor(current) + suffix;
        }, 16);
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#6366f1'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Form validation (for future contact form)
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });

    return isValid;
}

// Lazy loading for images (if added in future)
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Search functionality (for future implementation)
function initSearch() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const cards = document.querySelectorAll('.note-card, .question-card');
            
            cards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('p').textContent.toLowerCase();
                
                if (title.includes(query) || description.includes(query)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}

// Theme toggle (for future dark mode)
function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
        });

        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }
}

// Performance optimization
function initPerformanceOptimizations() {
    // Debounce scroll events
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(function() {
            // Scroll-based operations here
        }, 16);
    });

    // Preload critical resources
    const criticalResources = [
        'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
    ];

    criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = resource;
        document.head.appendChild(link);
    });
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    // You could send this to an error tracking service
});

// Service Worker registration (for PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showNotification,
        validateForm,
        getSubjectName: function(subject) {
            const names = {
                'math': 'Mathematics Notes',
                'physics': 'Physics Notes',
                'chemistry': 'Chemistry Notes',
                'biology': 'Biology Notes'
            };
            return names[subject] || subject;
        }
    };
}
