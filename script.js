let cropper;
const URL = "./";  // The model is in the same directory as script.js
let model, maxPredictions;

// Load the image model
async function loadModel() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
}

// Initialize the model and set up event listeners on page load
window.onload = () => {
    loadModel();

    const imageUpload = document.getElementById('imageUpload');
    const preview = document.getElementById('preview');
    const cropBtn = document.getElementById('cropBtn');
    const loadingIndicator = document.getElementById('loading');
    const labelContainer = document.getElementById('label-container');

    // When a new image is uploaded
    imageUpload.addEventListener('change', function (event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            preview.src = e.target.result;

            // Reset label container and hide previous results
            labelContainer.innerHTML = "";

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

            const canvas = cropper.getCroppedCanvas({
                width: 224,  // Size for the model input
                height: 224
            });

            // Convert the canvas to an image and wait for it to load before predicting
            const croppedImage = canvas.toDataURL('image/png');
            const image = new Image();

            image.onload = async () => {
                // Run the loaded cropped image through the model
                const prediction = await model.predict(image);

                // Reset the label container
                labelContainer.innerHTML = "";

                for (let i = 0; i < maxPredictions; i++) {
                    const classPrediction = `${prediction[i].className}: ${(prediction[i].probability * 100).toFixed(2)}%`;
                    const label = document.createElement("div");
                    label.innerHTML = classPrediction;
                    labelContainer.appendChild(label);
                }

                // Hide loading indicator and re-enable the button
                loadingIndicator.style.display = "none";
                cropBtn.disabled = false;
            };

            // Set the image source to the cropped data URL
            image.src = croppedImage;
        } else {
            alert("Please upload an image and wait for the model to load.");
        }
    });
};
