const MOCK_DATA_URL = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';
const GALLERY_DAYS = 9;

// --- DOM Elements ---
const exploreBtn = document.getElementById('explore-btn');
const endDateInput = document.getElementById('end-date');
const galleryContainer = document.getElementById('gallery');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const modalElement = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalDate = document.getElementById('modal-date');
const modalMediaContainer = document.getElementById('modal-media-container');
const modalExplanation = document.getElementById('modal-explanation');
const randomFactElement = document.getElementById('random-fact');

let allAPODData = []; // Cache to store the fetched array of data

// --- Utility Functions ---

/**
 * Gets the current date in YYYY-MM-DD format.
 * @returns {string} Today's date string.
 */
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Calculates the start date for a 9-day range ending on the given end date.
 * @param {string} endDateString - The end date in 'YYYY-MM-DD' format.
 * @returns {string} The start date in 'YYYY-MM-DD' format.
 */
function getStartDate(endDateString) {
    const endDate = new Date(endDateString);
    // Subtract 8 days to get a 9-day range (e.g., if end is day 9, start is day 1)
    endDate.setDate(endDate.getDate() - (GALLERY_DAYS - 1));
    return endDate.toISOString().split('T')[0];
}

/**
 * Shows/hides loading and error messages.
 * @param {boolean} isLoading 
 * @param {string|null} errorMessage 
 */
function updateUIState(isLoading = false, errorMessage = null) {
    loadingElement.classList.toggle('hidden', !isLoading);
    galleryContainer.classList.toggle('hidden', isLoading || !!errorMessage);
    errorElement.classList.toggle('hidden', !errorMessage);
    if (errorMessage) {
        errorText.textContent = errorMessage;
    }
}

// --- Data Fetching ---

/**
 * Fetches the mock APOD data from the CDN link.
 */
async function fetchAPODData() {
    updateUIState(true);
    galleryContainer.innerHTML = ''; // Clear previous content

    try {
        const response = await fetch(MOCK_DATA_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allAPODData = await response.json();
        
        // Render initial data when application loads
        const today = getTodayDate();
        endDateInput.value = today;
        filterAndRenderGallery(today);

    } catch (error) {
        console.error('Failed to fetch APOD data:', error);
        updateUIState(false, 'Failed to load core data from the JSON source. Please check the URL or network connection.');
    }
}

// --- Gallery and Rendering ---

/**
 * Filters the cached data array for the 9 days ending on the selected date.
 * @param {string} endDateString - The date string from the input field.
 */
function filterAndRenderGallery(endDateString) {
    updateUIState(true);
    galleryContainer.innerHTML = ''; 
    errorElement.classList.add('hidden'); // Clear errors

    const startDateString = getStartDate(endDateString);

    // 1. Filter the data to the correct date range
    const filteredData = allAPODData.filter(item => {
        return item.date >= startDateString && item.date <= endDateString;
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort descending by date

    // 2. Check if we have enough data
    if (filteredData.length < GALLERY_DAYS) {
        updateUIState(false, `Only found ${filteredData.length} entries. The selected date range might be too far in the past or data is missing.`);
        return;
    }

    // 3. Render the gallery items
    renderGallery(filteredData);
}

/**
 * Renders the gallery using the provided filtered data.
 * @param {Array<Object>} data - Array of APOD items.
 */
function renderGallery(data) {
    galleryContainer.innerHTML = '';

    data.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'gallery-item';
        itemElement.setAttribute('data-index', index);
        itemElement.addEventListener('click', () => openModal(item));

        let mediaHTML;

        // LevelUp: Handle Video Entries
        if (item.media_type === 'video') {
            // Use thumbnail_url for gallery item if available, otherwise use a placeholder
            const thumbnailUrl = item.thumbnail_url || 'placeholder';
            const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.3 2.841A1.5 1.5 0 0 1 7.643 2h8.714c.52 0 1.018.232 1.342.641l2.484 3.194a1.5 1.5 0 0 1 .117.75l-.946 5.86a1.5 1.5 0 0 1-1.464 1.255H4.729a1.5 1.5 0 0 1-1.464-1.255l-.946-5.86a1.5 1.5 0 0 1 .117-.75l2.484-3.194Zm-4.939 12.634a1.5 1.5 0 0 0-.254.912c.002.396.155.772.428 1.056l3.245 3.328a.75.75 0 0 0 1.036-.089l1.621-2.181a.75.75 0 0 0-.001-1.077l-1.636-1.78a.75.75 0 0 0-1.06-.017l-3.344 3.424Zm20.402 3.328a1.5 1.5 0 0 0 .428-1.056c.002-.396-.15-.772-.424-1.056l-3.344-3.424a.75.75 0 0 0-1.06.017l-1.636 1.78a.75.75 0 0 0-.001 1.077l1.621 2.181a.75.75 0 0 0 1.036.089l3.245-3.328Zm-4.85-8.484a.75.75 0 0 0-1.06 0l-.84.858a.75.75 0 0 0 0 1.06l.84.858a.75.75 0 0 0 1.06 0l.84-.858a.75.75 0 0 0 0-1.06l-.84-.858ZM12 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/></svg>`;
            
            if (thumbnailUrl === 'placeholder') {
                 mediaHTML = `<div class="media-placeholder">${icon}Video Content Available</div>`;
            } else {
                 mediaHTML = `
                    <div class="media-placeholder">
                        <img src="${thumbnailUrl}" alt="${item.title} Thumbnail" onerror="this.onerror=null; this.src='https://placehold.co/400x200/334155/f87171?text=Video+Content';" />
                        <div class="video-overlay">${icon} Click to Play</div>
                    </div>`;
            }

        } else {
            // Standard Image (use 'url' for gallery thumbnail)
            mediaHTML = `
                <img src="${item.url}" alt="${item.title}" 
                     onerror="this.onerror=null; this.src='https://placehold.co/400x200/334155/e2e8f0?text=Image+Not+Available';" />
            `;
        }

        itemElement.innerHTML = `
            <div class="gallery-item-media">${mediaHTML}</div>
            <div class="gallery-item-details">
                <h3>${item.title}</h3>
                <p>${item.date}</p>
            </div>
        `;

        galleryContainer.appendChild(itemElement);
    });

    updateUIState(false);
}

// --- Modal Functions ---

/**
 * Opens the modal with full details of the selected item.
 * @param {Object} item - The APOD data object.
 */
function openModal(item) {
    modalTitle.textContent = item.title;
    modalDate.textContent = item.date;
    modalExplanation.textContent = item.explanation;
    modalMediaContainer.innerHTML = ''; // Clear previous media

    if (item.media_type === 'video') {
        // Embed the video URL (usually YouTube or Vimeo iframe)
        const videoEmbed = document.createElement('div');
        videoEmbed.className = 'video-container';
        videoEmbed.innerHTML = `<iframe src="${item.url}" allowfullscreen></iframe>`;
        modalMediaContainer.appendChild(videoEmbed);
    } else {
        // Display the HD image if available, otherwise use the standard URL
        const imageUrl = item.hdurl || item.url;
        const imageElement = document.createElement('img');
        imageElement.src = imageUrl;
        imageElement.alt = item.title;
        modalMediaContainer.appendChild(imageElement);
    }

    modalElement.classList.add('visible');
}

/**
 * Closes the detail modal.
 */
function closeModal() {
    modalElement.classList.remove('visible');
    // Stop any embedded video when closing the modal
    modalMediaContainer.innerHTML = '';
}

// --- LevelUp: Random Fact ---

const spaceFacts = [
    "A day on Venus is longer than a year on Venus.",
    "The largest volcano in our solar system is on Mars (Olympus Mons).",
    "One million Earths could fit inside the Sun.",
    "There are more trees on Earth than stars in the Milky Way.",
    "The total mass of all the asteroids combined is less than the Earth’s Moon.",
    "Neutron stars are so dense that a teaspoon of their material would weigh about 6 billion tons.",
    "The speed of light is about 186,282 miles per second (299,792 kilometers per second)."
];

function displayRandomFact() {
    const fact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
    randomFactElement.textContent = fact;
}

// --- Initialization and Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    // Set the max date on the input field to today
    const today = getTodayDate();
    endDateInput.setAttribute('max', today);

    // Initial load: Fetch data and render the default 9-day gallery ending today
    fetchAPODData();
    displayRandomFact();

    // Event listener for the Explore button
    exploreBtn.addEventListener('click', () => {
        const selectedDate = endDateInput.value;
        if (selectedDate) {
            filterAndRenderGallery(selectedDate);
        } else {
            // Show error if no date is selected
            updateUIState(false, 'Please select a valid end date.');
        }
    });

    // Close modal when clicking outside or pressing ESC
    modalElement.addEventListener('click', (e) => {
        if (e.target === modalElement) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalElement.classList.contains('visible')) {
            closeModal();
        }
    });
});