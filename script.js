class PredictionChart {
    constructor(canvasId) {
        this.ctx = document.getElementById(canvasId).getContext('2d');
        this.chart = null;
        this.initChart();
    }

    // Initialize the chart with default values
    initChart() {
        this.chart = new Chart(this.ctx, {
            type: 'bar',
            data: {
                labels: ['Positive for Leishmaniasis', 'Negative for Leishmaniasis'],
                datasets: [{
                    label: 'Prediction Confidence (%)',
                    data: [0, 0], // Initial values
                    backgroundColor: ['#4CAF50', '#FF5733'],
                    borderColor: ['#388E3C', '#C70039'],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // Update the chart with new prediction data
    updateChart(positive, negative) {
        this.chart.data.datasets[0].data = [positive * 100, negative * 100]; // Scale to percentage
        this.chart.update();
    }
}

// Global variables
let cropper;
const URL_PATH = "./";  // Model path
let model, maxPredictions;
let predictionChart;

// Load the image model
async function loadModel() {
    const modelURL = URL_PATH + "model.json";
    const metadataURL = URL_PATH + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // "Warm up" the model with a dummy canvas
    const dummyCanvas = document.createElement('canvas');
    dummyCanvas.width = 224;
    dummyCanvas.height = 224;
    const dummyCtx = dummyCanvas.getContext('2d');
    dummyCtx.fillRect(0, 0, 224, 224); // A blank square
    await model.predict(dummyCanvas);
}

// Save the cropped image and return its base64 URL
function saveCroppedImage() {
    const canvas = cropper.getCroppedCanvas({
        width: 224,  // Resize the crop for the model
        height: 224
    });

    // Convert canvas to base64 image directly
    const base64Image = canvas.toDataURL('image/png');
    return base64Image;
}

// Initialize the model and set up event listeners on page load
window.onload = () => {
    loadModel();
    predictionChart = new PredictionChart('predictionChart'); // Create the prediction chart

    const imageUpload = document.getElementById('imageUpload');
    const preview = document.getElementById('preview');
    const cropBtn = document.getElementById('cropBtn');
    const loadingIndicator = document.getElementById('loading');

    // When a new image is uploaded
    imageUpload.addEventListener('change', function (event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            preview.src = e.target.result;

            if (cropper) {
                cropper.destroy(); // Destroy old cropper instance if it exists
            }

            // Initialize the cropper on the uploaded image
            cropper = new Cropper(preview, {
                aspectRatio: 1,
                viewMode: 1,
                autoCropArea: 1,
                responsive: true
            });
        };
        reader.readAsDataURL(file);
    });

    // When the crop button is clicked
    cropBtn.addEventListener('click', async () => {
        if (cropper && model) {
            // Show loading indicator and disable the button
            loadingIndicator.style.display = "block";
            cropBtn.disabled = true;

            // Save the cropped image as a base64 string
            const base64Image = saveCroppedImage();

            // Create a new image element from the base64 string
            const image = new Image();
            image.src = base64Image;

            // Wait until the image is fully loaded before sending it to the model
            image.onload = async () => {
                const prediction = await model.predict(image);

                // Extract probabilities for Positive and Negative Leishmaniasis
                const positiveLeishIndex = prediction.findIndex(p => p.className.toLowerCase().includes('positive'));
                const negativeLeishIndex = prediction.findIndex(p => p.className.toLowerCase().includes('negative'));

                const positiveLeish = prediction[positiveLeishIndex].probability;
                const negativeLeish = prediction[negativeLeishIndex].probability;

                // Update the chart with prediction data
                predictionChart.updateChart(positiveLeish, negativeLeish);

                // Hide loading indicator and re-enable the button
                loadingIndicator.style.display = "none";
                cropBtn.disabled = false;
            };

            // In case the image fails to load, handle it
            image.onerror = () => {
                alert("Failed to load cropped image. Please try again.");
                loadingIndicator.style.display = "none";
                cropBtn.disabled = false;
            };
        } else {
            alert("Please upload an image and wait for the model to load.");
        }
    });
};
