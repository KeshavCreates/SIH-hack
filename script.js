document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // File Upload & Analyzer Logic
    const dropZone = document.getElementById('drop-zone');
    const fileUpload = document.getElementById('file-upload');
    const previewImage = document.getElementById('preview-image');
    const uploadIcon = document.getElementById('upload-icon');
    const uploadText = document.getElementById('upload-text');
    const analyzeButton = document.getElementById('analyze-button');
    const buttonText = document.getElementById('button-text');
    const buttonSpinner = document.getElementById('button-spinner');

    const resultsModal = document.getElementById('results-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const modalContent = document.getElementById('modal-content');

    let uploadedFile = null; // Store the actual file object

    const handleFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            uploadedFile = file; // Keep the file object
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                previewImage.classList.remove('hidden');
                uploadIcon.classList.add('hidden');
                uploadText.classList.add('hidden');
                analyzeButton.disabled = false;
            };
            reader.readAsDataURL(file);
        } else {
            // In a real app, use a custom modal for alerts
            alert('Please upload a valid image file (PNG, JPG).');
            uploadedFile = null;
            analyzeButton.disabled = true;
        }
    };

    fileUpload.addEventListener('change', (e) => handleFile(e.target.files[0]));
    
    // Drag and Drop Listeners
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-blue-500', 'bg-gray-800/50');
    });
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500', 'bg-gray-800/50');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500', 'bg-gray-800/50');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    analyzeButton.addEventListener('click', () => {
        if (uploadedFile) {
            analyzeDocument(uploadedFile);
        }
    });

    closeModalButton.addEventListener('click', () => {
        resultsModal.classList.add('hidden');
        resultsModal.classList.remove('flex');
    });

    const showLoading = (isLoading) => {
        buttonText.classList.toggle('hidden', isLoading);
        buttonSpinner.classList.toggle('hidden', !isLoading);
        analyzeButton.disabled = isLoading;
    };

    const displayResults = (data) => {
        let html = `<h2 class="text-2xl font-bold text-white mb-6">Analysis Report</h2>`;
        if (data.error) {
            html += `<div class="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-lg">
                        <p class="font-bold">An Error Occurred</p>
                        <p>${data.error}</p>
                    </div>`;
        } else {
            html += `<div class="mb-6">
                        <h3 class="text-lg font-semibold text-blue-400 mb-2">Summary</h3>
                        <p class="text-gray-300">${data.summary.replace(/\n/g, '<br>')}</p>
                    </div>`;
            if (data.keyDetails && data.keyDetails.length > 0) {
                html += `<div class="mb-6">
                            <h3 class="text-lg font-semibold text-blue-400 mb-2">Key Details</h3>
                            <ul class="list-disc list-inside space-y-2 text-gray-300">
                                ${data.keyDetails.map(detail => `<li>${detail}</li>`).join('')}
                            </ul>
                        </div>`;
            }
            if (data.risks && data.risks.length > 0) {
                html += `<div>
                            <h3 class="text-lg font-semibold text-blue-400 mb-3">Potential Risks</h3>
                            <div class="space-y-4">${data.risks.map(getRiskHTML).join('')}</div>
                        </div>`;
            }
        }
        modalContent.innerHTML = html;
        resultsModal.classList.remove('hidden');
        resultsModal.classList.add('flex');
    };

    const getRiskHTML = (item) => {
        let colorClasses = '';
        switch (item.severity?.toLowerCase()) {
            case 'high': colorClasses = 'border-red-500/30 bg-red-500/10 text-red-300'; break;
            case 'medium': colorClasses = 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'; break;
            case 'low': colorClasses = 'border-green-500/30 bg-green-500/10 text-green-300'; break;
            default: colorClasses = 'border-gray-500/30 bg-gray-500/10 text-gray-300';
        }
        return `<div class="p-4 rounded-lg border ${colorClasses}">
                    <div class="flex items-center justify-between"><span class="font-bold">${item.severity || 'Notice'}</span></div>
                    <p class="mt-2 text-white/90">${item.risk}</p>
                </div>`;
    };

    async function analyzeDocument(file) {
        showLoading(true);
        const formData = new FormData();
        formData.append('document', file);

        try {
            // CORRECTED: Changed to a relative URL to prevent CORS/404 errors.
            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }

            displayResults(data);

        } catch (error) {
            console.error('Error analyzing document:', error);
            displayResults({ error: error.message || 'Failed to connect to the analysis service.' });
        } finally {
            showLoading(false);
        }
    }
});

