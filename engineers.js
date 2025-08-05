// Function to fetch engineer data and display it on the page
async function fetchEngineers() {
    try {
        console.log('Fetching engineers data from /data/engineers...');
        const response = await fetch('/data/engineers'); 

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const engineers = await response.json();
        const engineersContainer = document.getElementById('engineers-container');
        
        if (!engineersContainer) {
            console.error('Engineers container div not found.');
            return;
        }
        
        // Clear the loading message
        engineersContainer.innerHTML = '';

        if (engineers.length === 0) {
            engineersContainer.innerHTML = '<p>No engineers found.</p>';
            return;
        }

        engineers.forEach(engineer => {
            const engineerCard = document.createElement('div');
            engineerCard.className = 'engineer-card'; // Use the class name from your original HTML
            engineerCard.innerHTML = `
                <img src="${engineer.profilePictureUrl || 'https://via.placeholder.com/150'}" alt="${engineer.name}" class="engineer-img">
                <h2 class="engineer-name">${engineer.name}</h2>
                <div class="engineer-text-content">
                    <p class="engineer-brief">Specialization: ${engineer.specialization || 'Not specified'}</p>
                    <p class="qualifications">Experience: ${engineer.experience} years</p>
                </div>
                <a class="details-link" href="/engineers/${engineer.engineerId}">View Visiting Card</a>
            `;
            engineersContainer.appendChild(engineerCard);
        });

    } catch (error) {
        console.error('Failed to fetch engineers:', error);
        const engineersContainer = document.getElementById('engineers-container');
        if (engineersContainer) {
            engineersContainer.innerHTML = '<p class="text-danger">Failed to load engineers data. Please check the server.</p>';
        }
    }
}

document.addEventListener('DOMContentLoaded', fetchEngineers);