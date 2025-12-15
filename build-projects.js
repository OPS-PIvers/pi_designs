#!/usr/bin/env node
/**
 * Dynamic Project Builder for 314 Solutions
 *
 * This script scans the /projects directory for project subdirectories,
 * reads their metadata and media files, and generates HTML for project
 * cards and modal popups that get injected into index.html.
 *
 * Usage: node build-projects.js
 *
 * Project Directory Structure:
 *   projects/
 *     Project_Name/
 *       project.md       - Required: Project metadata and description
 *       cover.jpg/png    - Optional: Cover image for the card
 *       *.jpg/png/webp   - Optional: Gallery images
 *       *.mp4            - Optional: Video files
 */

const fs = require('fs');
const path = require('path');

const PROJECTS_DIR = path.join(__dirname, 'projects');
const INDEX_FILE = path.join(__dirname, 'index.html');

// Markers in index.html where we inject generated content
const PROJECTS_START = '<!-- DYNAMIC-PROJECTS-START -->';
const PROJECTS_END = '<!-- DYNAMIC-PROJECTS-END -->';
const MODALS_START = '<!-- PROJECT-MODALS-START -->';
const MODALS_END = '<!-- PROJECT-MODALS-END -->';

/**
 * Parse a project.md file with YAML-like front matter
 */
function parseProjectMd(content) {
    const lines = content.split('\n');
    const metadata = {};
    let inFrontMatter = false;
    let bodyStartIndex = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line === '---') {
            if (!inFrontMatter) {
                inFrontMatter = true;
                continue;
            } else {
                bodyStartIndex = i + 1;
                break;
            }
        }

        if (inFrontMatter && line.includes(':')) {
            const colonIndex = line.indexOf(':');
            const key = line.substring(0, colonIndex).trim().toLowerCase();
            const value = line.substring(colonIndex + 1).trim();
            metadata[key] = value;
        }
    }

    const body = lines.slice(bodyStartIndex).join('\n').trim();

    return { metadata, body };
}

/**
 * Convert markdown to simple HTML
 */
function markdownToHtml(md) {
    if (!md) return '';

    return md
        // Headers
        .replace(/^### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^## (.+)$/gm, '<h3>$1</h3>')
        .replace(/^# (.+)$/gm, '<h2>$1</h2>')
        // Bold and italic
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        // Unordered lists
        .replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        // Paragraphs (double newlines)
        .split(/\n\n+/)
        .map(p => {
            p = p.trim();
            if (!p) return '';
            if (p.startsWith('<h') || p.startsWith('<ul')) return p;
            return `<p>${p.replace(/\n/g, ' ')}</p>`;
        })
        .join('\n');
}

/**
 * Get media files from a project directory
 */
function getMediaFiles(projectDir) {
    const files = fs.readdirSync(projectDir);
    const media = {
        cover: null,
        images: [],
        videos: []  // Each video: { file: string, loop: boolean }
    };

    const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const videoExts = ['.mp4', '.webm', '.mov'];

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        const baseName = path.basename(file, ext).toLowerCase();

        if (imageExts.includes(ext)) {
            if (baseName === 'cover' || baseName === 'thumbnail' || baseName === 'preview') {
                media.cover = file;
            } else {
                media.images.push(file);
            }
        } else if (videoExts.includes(ext)) {
            // Check if video should loop (filename contains '_loop' or starts with 'loop')
            const shouldLoop = baseName.includes('_loop') || baseName.startsWith('loop');
            media.videos.push({ file, loop: shouldLoop });
        }
    }

    // If no explicit cover, use the first image
    if (!media.cover && media.images.length > 0) {
        media.cover = media.images.shift();
    }

    return media;
}

/**
 * Generate HTML for a project card
 */
function generateProjectCard(project, slug) {
    const { metadata, media } = project;
    const tech = metadata.tech ? metadata.tech.split(',').map(t => t.trim()) : [];

    // Determine the image source
    let imageHtml = '';
    if (media.cover) {
        const imgPath = `projects/${slug}/${media.cover}`;
        imageHtml = `
                        <img src="${imgPath}" alt="${metadata.title}" loading="lazy">`;
    } else {
        // Placeholder for projects without images
        imageHtml = `
                        <div class="project-placeholder">
                            <i class="fas fa-folder-open"></i>
                            <span>Preview Coming Soon</span>
                        </div>`;
    }

    // Tech badges
    const techBadges = tech.map(t => `<span class="tech-badge">${t}</span>`).join('\n                                ');

    // Links section
    let linksHtml = '';
    if (metadata.github) {
        linksHtml += `
                            <a href="${metadata.github}" class="project-link" target="_blank" rel="noopener">
                                <i class="fab fa-github"></i> View on GitHub
                            </a>`;
    }
    if (metadata.live) {
        linksHtml += `
                            <a href="${metadata.live}" class="project-link live-link" target="_blank" rel="noopener">
                                <i class="fas fa-external-link-alt"></i> Live Demo
                            </a>`;
    }

    return `
                    <!-- ${metadata.title} -->
                    <div class="project-card" data-project="${slug}">
                        <div class="project-image">${imageHtml}
                            <div class="project-overlay">
                                <button class="view-project-btn" onclick="openProjectModal('${slug}')">
                                    <i class="fas fa-expand"></i> View Details
                                </button>
                            </div>
                        </div>
                        <div class="project-content">
                            <span class="project-category">${metadata.category || 'Project'}</span>
                            <h3 class="project-title">${metadata.title}</h3>
                            <p class="project-description">${metadata.description || ''}</p>
                            <div class="project-tech">
                                ${techBadges}
                            </div>
                            <div class="project-links">${linksHtml}
                            </div>
                        </div>
                    </div>`;
}

/**
 * Generate HTML for a project modal
 */
function generateProjectModal(project, slug) {
    const { metadata, body, media } = project;
    const tech = metadata.tech ? metadata.tech.split(',').map(t => t.trim()) : [];

    // Gallery section
    let galleryHtml = '';
    const allMedia = [];

    if (media.cover) {
        allMedia.push({ type: 'image', src: `projects/${slug}/${media.cover}` });
    }
    for (const img of media.images) {
        allMedia.push({ type: 'image', src: `projects/${slug}/${img}` });
    }
    for (const vid of media.videos) {
        allMedia.push({ type: 'video', src: `projects/${slug}/${vid.file}`, loop: vid.loop });
    }

    if (allMedia.length > 0) {
        const mediaItems = allMedia.map((item, idx) => {
            if (item.type === 'image') {
                return `
                        <div class="gallery-item${idx === 0 ? ' active' : ''}" data-index="${idx}">
                            <img src="${item.src}" alt="${metadata.title} screenshot ${idx + 1}" loading="lazy">
                        </div>`;
            } else {
                // Looping videos autoplay muted like GIFs; regular videos have controls
                const videoAttrs = item.loop
                    ? 'autoplay loop muted playsinline class="loop-video"'
                    : 'controls';
                return `
                        <div class="gallery-item${idx === 0 ? ' active' : ''}${item.loop ? ' loop-video-container' : ''}" data-index="${idx}">
                            <video ${videoAttrs}>
                                <source src="${item.src}" type="video/${path.extname(item.src).slice(1)}">
                                Your browser does not support video playback.
                            </video>
                        </div>`;
            }
        }).join('');

        const thumbnails = allMedia.map((item, idx) => {
            if (item.type === 'image') {
                return `
                            <button class="gallery-thumb${idx === 0 ? ' active' : ''}" data-index="${idx}">
                                <img src="${item.src}" alt="Thumbnail ${idx + 1}">
                            </button>`;
            } else {
                // Use sync icon for looping videos, play icon for regular videos
                const icon = item.loop ? 'fa-sync-alt' : 'fa-play-circle';
                return `
                            <button class="gallery-thumb${idx === 0 ? ' active' : ''}" data-index="${idx}" title="${item.loop ? 'Looping video' : 'Video'}">
                                <i class="fas ${icon}"></i>
                            </button>`;
            }
        }).join('');

        galleryHtml = `
                <div class="modal-gallery">
                    <div class="gallery-main">${mediaItems}
                        ${allMedia.length > 1 ? `
                        <button class="gallery-nav gallery-prev"><i class="fas fa-chevron-left"></i></button>
                        <button class="gallery-nav gallery-next"><i class="fas fa-chevron-right"></i></button>` : ''}
                    </div>
                    ${allMedia.length > 1 ? `
                    <div class="gallery-thumbnails">${thumbnails}
                    </div>` : ''}
                </div>`;
    }

    // Tech tags
    const techTags = tech.map(t => `<span class="modal-tech-tag">${t}</span>`).join('');

    // Links
    let linksHtml = '';
    if (metadata.github) {
        linksHtml += `
                    <a href="${metadata.github}" class="modal-link github" target="_blank" rel="noopener">
                        <i class="fab fa-github"></i> View Source Code
                    </a>`;
    }
    if (metadata.live) {
        linksHtml += `
                    <a href="${metadata.live}" class="modal-link live" target="_blank" rel="noopener">
                        <i class="fas fa-external-link-alt"></i> Launch Demo
                    </a>`;
    }

    // Body content
    const bodyHtml = markdownToHtml(body);

    return `
        <!-- ${metadata.title} Modal -->
        <div class="project-modal" id="modal-${slug}" role="dialog" aria-labelledby="modal-title-${slug}" aria-hidden="true">
            <div class="modal-backdrop" onclick="closeProjectModal('${slug}')"></div>
            <div class="modal-container">
                <button class="modal-close" onclick="closeProjectModal('${slug}')" aria-label="Close modal">
                    <i class="fas fa-times"></i>
                </button>
                ${galleryHtml}
                <div class="modal-content">
                    <span class="modal-category">${metadata.category || 'Project'}</span>
                    <h2 class="modal-title" id="modal-title-${slug}">${metadata.title}</h2>
                    <div class="modal-tech-stack">
                        ${techTags}
                    </div>
                    <div class="modal-description">
                        ${bodyHtml || `<p>${metadata.description || ''}</p>`}
                    </div>
                    <div class="modal-links">
                        ${linksHtml}
                    </div>
                </div>
            </div>
        </div>`;
}

/**
 * Load all projects from the projects directory
 */
function loadProjects() {
    const projects = [];

    if (!fs.existsSync(PROJECTS_DIR)) {
        console.log('No projects directory found. Creating one...');
        fs.mkdirSync(PROJECTS_DIR, { recursive: true });
        return projects;
    }

    const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const projectDir = path.join(PROJECTS_DIR, entry.name);
        const projectMdPath = path.join(projectDir, 'project.md');

        if (!fs.existsSync(projectMdPath)) {
            console.log(`Skipping ${entry.name}: no project.md found`);
            continue;
        }

        const content = fs.readFileSync(projectMdPath, 'utf-8');
        const { metadata, body } = parseProjectMd(content);
        const media = getMediaFiles(projectDir);

        projects.push({
            slug: entry.name,
            metadata,
            body,
            media
        });
    }

    // Sort by order if specified, otherwise alphabetically by title
    projects.sort((a, b) => {
        const orderA = parseInt(a.metadata.order) || 999;
        const orderB = parseInt(b.metadata.order) || 999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.metadata.title || a.slug).localeCompare(b.metadata.title || b.slug);
    });

    return projects;
}

/**
 * Generate the CSS for modals and galleries
 */
function generateModalCSS() {
    return `
    /* Project Modal Styles - Auto-generated by build-projects.js */
    .project-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .project-modal.active {
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 1;
    }

    .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        cursor: pointer;
    }

    .modal-container {
        position: relative;
        background: var(--bg-card, #fff);
        border-radius: 16px;
        max-width: 900px;
        max-height: 90vh;
        width: 90%;
        overflow-y: auto;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        animation: modalSlideIn 0.3s ease;
    }

    @keyframes modalSlideIn {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 40px;
        height: 40px;
        border: none;
        background: var(--bg-surface, #f5f5f5);
        border-radius: 50%;
        cursor: pointer;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        color: var(--text-secondary, #666);
        transition: all 0.2s ease;
    }

    .modal-close:hover {
        background: var(--accent-kinetic, #2d5a4a);
        color: white;
    }

    .modal-gallery {
        position: relative;
        background: #000;
    }

    .gallery-main {
        position: relative;
        width: 100%;
        aspect-ratio: 16/9;
        overflow: hidden;
    }

    .gallery-item {
        display: none;
        width: 100%;
        height: 100%;
    }

    .gallery-item.active {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .gallery-item img,
    .gallery-item video {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }

    .gallery-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 50px;
        height: 50px;
        border: none;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.25rem;
        color: #333;
        transition: all 0.2s ease;
    }

    .gallery-nav:hover {
        background: white;
        transform: translateY(-50%) scale(1.1);
    }

    .gallery-prev { left: 1rem; }
    .gallery-next { right: 1rem; }

    .gallery-thumbnails {
        display: flex;
        gap: 0.5rem;
        padding: 0.75rem;
        background: rgba(0, 0, 0, 0.8);
        overflow-x: auto;
        justify-content: center;
    }

    .gallery-thumb {
        width: 60px;
        height: 45px;
        border: 2px solid transparent;
        border-radius: 4px;
        overflow: hidden;
        cursor: pointer;
        padding: 0;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .gallery-thumb.active {
        border-color: var(--accent-solar, #d4a574);
    }

    .gallery-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .gallery-thumb i {
        font-size: 1.25rem;
        color: white;
    }

    .modal-content {
        padding: 2rem;
    }

    .modal-category {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: var(--accent-kinetic, #2d5a4a);
        color: white;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.75rem;
    }

    .modal-title {
        font-family: var(--font-head, serif);
        font-size: 2rem;
        color: var(--text-primary, #1a1a1a);
        margin-bottom: 1rem;
    }

    .modal-tech-stack {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
    }

    .modal-tech-tag {
        padding: 0.25rem 0.75rem;
        background: var(--bg-surface, #f5f5f5);
        border-radius: 4px;
        font-size: 0.8rem;
        color: var(--text-secondary, #666);
    }

    .modal-description {
        color: var(--text-secondary, #4a4a4a);
        line-height: 1.7;
        margin-bottom: 2rem;
    }

    .modal-description h2,
    .modal-description h3,
    .modal-description h4 {
        color: var(--text-primary, #1a1a1a);
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
    }

    .modal-description h3 { font-size: 1.25rem; }
    .modal-description h4 { font-size: 1.1rem; }

    .modal-description ul {
        padding-left: 1.5rem;
        margin: 1rem 0;
    }

    .modal-description li {
        margin-bottom: 0.5rem;
    }

    .modal-description a {
        color: var(--accent-kinetic, #2d5a4a);
        text-decoration: underline;
    }

    .modal-links {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .modal-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.2s ease;
    }

    .modal-link.github {
        background: #24292e;
        color: white;
    }

    .modal-link.github:hover {
        background: #1b1f23;
    }

    .modal-link.live {
        background: var(--accent-kinetic, #2d5a4a);
        color: white;
    }

    .modal-link.live:hover {
        background: var(--accent-moss, #1e3d32);
    }

    /* Project card overlay for click-to-view */
    .project-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .project-card:hover .project-overlay {
        opacity: 1;
    }

    .view-project-btn {
        padding: 0.75rem 1.5rem;
        background: white;
        color: #1a1a1a;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
    }

    .view-project-btn:hover {
        background: var(--accent-solar, #d4a574);
        color: white;
        transform: scale(1.05);
    }

    .project-placeholder {
        width: 100%;
        height: 200px;
        background: linear-gradient(135deg, var(--bg-surface, #f5f5f5), var(--bg-card, #eee));
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        color: var(--text-muted, #999);
    }

    .project-placeholder i {
        font-size: 2.5rem;
    }

    .project-placeholder span {
        font-size: 0.875rem;
    }

    /* Responsive modal */
    @media (max-width: 768px) {
        .modal-container {
            width: 95%;
            max-height: 95vh;
            border-radius: 12px;
        }

        .modal-content {
            padding: 1.5rem;
        }

        .modal-title {
            font-size: 1.5rem;
        }

        .gallery-nav {
            width: 40px;
            height: 40px;
        }

        .modal-links {
            flex-direction: column;
        }

        .modal-link {
            justify-content: center;
        }
    }`;
}

/**
 * Generate the JavaScript for modal functionality
 */
function generateModalJS() {
    return `
    // Project Modal Functions - Auto-generated by build-projects.js
    function openProjectModal(slug) {
        const modal = document.getElementById('modal-' + slug);
        if (!modal) return;

        document.body.style.overflow = 'hidden';
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');

        // Focus trap
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        // Initialize gallery if present
        initModalGallery(modal);
    }

    function closeProjectModal(slug) {
        const modal = document.getElementById('modal-' + slug);
        if (!modal) return;

        document.body.style.overflow = '';
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }

    function initModalGallery(modal) {
        const gallery = modal.querySelector('.modal-gallery');
        if (!gallery) return;

        const items = gallery.querySelectorAll('.gallery-item');
        const thumbs = gallery.querySelectorAll('.gallery-thumb');
        const prevBtn = gallery.querySelector('.gallery-prev');
        const nextBtn = gallery.querySelector('.gallery-next');
        let currentIndex = 0;

        function showItem(index) {
            items.forEach((item, i) => {
                item.classList.toggle('active', i === index);
            });
            thumbs.forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
            });
            currentIndex = index;
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const newIndex = (currentIndex - 1 + items.length) % items.length;
                showItem(newIndex);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const newIndex = (currentIndex + 1) % items.length;
                showItem(newIndex);
            });
        }

        thumbs.forEach((thumb, index) => {
            thumb.addEventListener('click', () => showItem(index));
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.project-modal.active');
            if (activeModal) {
                const slug = activeModal.id.replace('modal-', '');
                closeProjectModal(slug);
            }
        }
    });`;
}

/**
 * Update index.html with the generated content
 */
function updateIndexHtml(projectsHtml, modalsHtml) {
    let html = fs.readFileSync(INDEX_FILE, 'utf-8');

    // Check if markers exist, if not we need to add them
    if (!html.includes(PROJECTS_START)) {
        console.log('Project markers not found in index.html. Please add them manually.');
        console.log(`Add "${PROJECTS_START}" and "${PROJECTS_END}" around your project cards.`);
        console.log(`Add "${MODALS_START}" and "${MODALS_END}" before </body> for modals.`);
        return false;
    }

    // Replace projects section
    const projectsRegex = new RegExp(`${escapeRegex(PROJECTS_START)}[\\s\\S]*?${escapeRegex(PROJECTS_END)}`);
    html = html.replace(projectsRegex, `${PROJECTS_START}\n${projectsHtml}\n                ${PROJECTS_END}`);

    // Replace modals section
    if (html.includes(MODALS_START)) {
        const modalsRegex = new RegExp(`${escapeRegex(MODALS_START)}[\\s\\S]*?${escapeRegex(MODALS_END)}`);
        html = html.replace(modalsRegex, `${MODALS_START}\n${modalsHtml}\n    ${MODALS_END}`);
    }

    fs.writeFileSync(INDEX_FILE, html);
    return true;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Main build function
 */
function build() {
    console.log('Building dynamic projects...\n');

    const projects = loadProjects();

    if (projects.length === 0) {
        console.log('No projects found in /projects directory.');
        console.log('Create a subdirectory with a project.md file to get started.');
        console.log('\nExample structure:');
        console.log('  projects/');
        console.log('    My_Project/');
        console.log('      project.md');
        console.log('      cover.jpg');
        return;
    }

    console.log(`Found ${projects.length} project(s):\n`);

    // Generate HTML for each project
    const projectCards = [];
    const projectModals = [];

    for (const project of projects) {
        console.log(`  - ${project.metadata.title || project.slug}`);
        projectCards.push(generateProjectCard(project, project.slug));
        projectModals.push(generateProjectModal(project, project.slug));
    }

    const projectsHtml = projectCards.join('\n');
    const modalsHtml = projectModals.join('\n');

    // Update index.html
    if (updateIndexHtml(projectsHtml, modalsHtml)) {
        console.log('\nSuccessfully updated index.html!');
    }

    // Output CSS and JS that need to be added
    console.log('\n' + '='.repeat(60));
    console.log('Make sure the following CSS and JS are included in your page:');
    console.log('='.repeat(60));
    console.log('\nCSS (add to your <style> tag or external stylesheet):');
    console.log(generateModalCSS());
    console.log('\nJS (add to your <script> tag or external script):');
    console.log(generateModalJS());
}

// Run the build
build();
