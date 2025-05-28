 // ===================== MAP INITIALIZATION =====================

// Base API URL - change this for deployment
 const API_BASE_URL = "https://recycling-backend.onrender.com/api";


// Initialize the map
let map = L.map('map').setView([17.385, 78.4867], 12); // Hyderabad

// Load OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Store all markers so we can clear them later
let mapMarkers = [];

// ===================== SEARCH FUNCTIONS =====================

// Search using user input
function searchLocation() {
    const locationInput = document.getElementById("locationInput").value;

    if (!locationInput) {
        alert("Please enter a location.");
        return;
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationInput)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                alert("Location not found!");
                return;
            }

            const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            map.setView(coords, 14);

            clearMapMarkers();
            const userMarker = L.marker(coords).addTo(map).bindPopup("You are here!").openPopup();
            mapMarkers.push(userMarker);

            addRecyclingCenters(document.getElementById("material-filter").value, coords);
        })
        .catch(error => {
            console.error("Error fetching location:", error);
            alert("An error occurred while searching for the location.");
        });
}

// Clear previous markers
function clearMapMarkers() {
    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapMarkers = [];
}

// Add recycling centers based on selected material
function addRecyclingCenters(filterMaterial = "all", userCoords = null) {
    const centersList = document.getElementById("centers");
    centersList.innerHTML = "";

    if (userCoords) {
        const userMarker = L.marker(userCoords).addTo(map).bindPopup("You are here!").openPopup();
        mapMarkers.push(userMarker);
    }

    // Fetch recycling centers from the backend
    loadRecyclingCenters(filterMaterial);
}

// ===================== BACKEND DATA LOADING =====================

// Fetch recycling centers from the backend
async function loadRecyclingCenters(filterMaterial = "all") {
    try {
        const centersList = document.getElementById("centers");
        centersList.innerHTML = ""; // Clear old data

        const url = filterMaterial !== "all" 
            ? `${API_BASE_URL}/centers?category=${filterMaterial}` 
            : `${API_BASE_URL}/centers`;
        
        const response = await fetch(url);
        const centers = await response.json();

        console.log("✅ Centers fetched from backend:", centers);

        // Clear previous markers before adding new ones
        clearMapMarkers();

        if (centers.length === 0) {
            centersList.innerHTML = "<li>No recycling centers found for the selected material.</li>";
        }

        centers.forEach(center => {
            if (center.location && center.location.lat && center.location.lng) {
                const marker = L.marker([center.location.lat, center.location.lng]).addTo(map);
                marker.bindPopup(`
                    <b>${center.name}</b><br>
                    ${center.address}<br>
                    Category: ${center.category}
                `);
                mapMarkers.push(marker);

                // Also update the list of centers in the sidebar
                const li = document.createElement("li");
                li.innerHTML = `<strong>${center.name}</strong> - Category: ${center.category}`;
                centersList.appendChild(li);
            } else {
                console.warn("❌ Invalid center data:", center);
            }
        });
    } catch (error) {
        console.error('❌ Error loading centers:', error);
    }
}

// ===================== DARK MODE =====================

document.getElementById("dark-mode-toggle").addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("dark-mode", document.body.classList.contains("dark-mode") ? "enabled" : "disabled");
});

document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("dark-mode") === "enabled") {
        document.body.classList.add("dark-mode");
    }
});

// ===================== CONTACT FORM HANDLER =====================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactform');
    if (!form) {
        console.error("❌ Contact form not found in DOM.");
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        console.log("Sending data to backend:", { name, email, message });

        try {
            const res = await fetch(`${API_BASE_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message })
            });

            const data = await res.json();
            console.log("✅ Response from server:", data);
            alert("✅ Message sent successfully!");
            form.reset();
        } catch (err) {
            console.error("❌ Error sending message:", err);
            alert("❌ Failed to send message. Please try again.");
        }
    });
});

// ===================== MATERIAL FILTER HANDLER =====================

document.getElementById("material-filter").addEventListener("change", (e) => {
    const selectedMaterial = e.target.value;
    loadRecyclingCenters(selectedMaterial);
});

// ===================== CLEAR SEARCH =====================

function clearSearch() {
    document.getElementById("locationInput").value = "";
    document.getElementById("material-filter").value = "all";
    const centersList = document.getElementById("centers");
    centersList.innerHTML = "";
    map.setView([17.385, 78.4867], 12); // Reset to default location
    clearMapMarkers();
    addRecyclingCenters();
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: "smooth" // Smooth scrolling effect
    });
}

// Show or hide the "Back to Top" button based on scroll position
window.addEventListener("scroll", () => {
    const backToTopButton = document.getElementById("back-to-top");
    if (window.scrollY > 300) { // Show button after scrolling 300px
        backToTopButton.style.display = "block";
    } else {
        backToTopButton.style.display = "none";
    }
});

// ===================== CALL TO LOAD DEFAULT CENTERS =====================

loadRecyclingCenters();
