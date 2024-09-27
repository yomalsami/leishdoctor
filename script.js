class PredictionChart {
    constructor(canvasId) {
        this.ctx = document.getElementById(canvasId).getContext('2d');
        this.chart = null;
        this.initChart();
    }

    initChart() {
        this.chart = new Chart(this.ctx, {
            type: 'bar',
            data: {
                labels: ['Positive for Leishmaniasis', 'Negative for Leishmaniasis'],
                datasets: [{
                    label: 'Prediction Confidence (%)',
                    data: [0, 0],
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

    updateChart(positive, negative) {
        this.chart.data.datasets[0].data = [positive * 100, negative * 100];
        this.chart.update();
    }
}

let cropper;
const URL_PATH = "./"; 
let model, maxPredictions;
let predictionChart;

async function loadModel() {
    const modelURL = URL_PATH + "model.json";
    const metadataURL = URL_PATH + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Perform a dummy prediction to warm up the model
    const dummyCanvas = document.createElement('canvas');
    dummyCanvas.width = 224;
    dummyCanvas.height = 224;
    const dummyCtx = dummyCanvas.getContext('2d');
    dummyCtx.fillRect(0, 0, 224, 224);
    await model.predict(dummyCanvas);
}

function saveCroppedImage() {
    const canvas = cropper.getCroppedCanvas({
        width: 224,
        height: 224
    });
    const base64Image = canvas.toDataURL('image/png');
    return base64Image;
}

window.onload = () => {
    loadModel(); // Load model on page load
    predictionChart = new PredictionChart('predictionChart'); // Initialize chart

    const imageUpload = document.getElementById('imageUpload');
    const preview = document.getElementById('preview');
    const cropBtn = document.getElementById('cropBtn');
    const loadingIndicator = document.getElementById('loading');

    // Handle image upload and cropping functionality
    imageUpload.addEventListener('change', function (event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block'; // Show the preview

            if (cropper) {
                cropper.destroy(); // Destroy previous cropper instance
            }

            // Initialize the Cropper.js instance
            cropper = new Cropper(preview, {
                aspectRatio: 1,
                viewMode: 1,
                autoCropArea: 1,
                responsive: true,
                scalable: true,
                zoomable: true,
                minContainerHeight: 300
            });
        };
        reader.readAsDataURL(file);

        // Reset chart data when a new image is uploaded
        predictionChart.updateChart(0, 0);
    });

    // Handle the crop and identify button click
    cropBtn.addEventListener('click', async () => {
        if (cropper && model) {
            loadingIndicator.style.display = "block"; // Show loading indicator
            cropBtn.disabled = true; // Disable button while processing

            const base64Image = saveCroppedImage();
            const image = new Image();
            image.src = base64Image;

            image.onload = async () => {
                const prediction = await model.predict(image);

                const positiveLeishIndex = prediction.findIndex(p => p.className.toLowerCase().includes('positive'));
                const negativeLeishIndex = prediction.findIndex(p => p.className.toLowerCase().includes('negative'));

                const positiveLeish = prediction[positiveLeishIndex].probability;
                const negativeLeish = prediction[negativeLeishIndex].probability;

                // Update the chart with new predictions
                predictionChart.updateChart(positiveLeish, negativeLeish);

                loadingIndicator.style.display = "none"; // Hide loading indicator
                cropBtn.disabled = false; // Re-enable button
            };

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
