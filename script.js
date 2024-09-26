let cropper;
const URL = "./";  // The model is in the same directory as script.js
let model, maxPredictions;

// Load the image model
async function loadModel() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
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

// Function to convert base64 image to blob
function base64ToBlob(base64, mime) {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mime });
}

// Save the cropped image and return its URL
function saveCroppedImage() {
    const canvas = cropper.getCroppedCanvas({
        width: 224,  // Resize the crop for the model
        height: 224
    });

    // Convert canvas to base64 and save as blob
    const base64Image = canvas.toDataURL('image/png');
    const imageBlob = base64ToBlob(base64Image, 'image/png');

    // Create URL for the blob
    const savedImageURL = URL.createObjectURL(imageBlob);
    return savedImageURL;
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

            // Reset the label container before prediction
            labelContainer.innerHTML = "";

            // Save the cropped image first
            const savedImageURL = saveCroppedImage();

            // Create a new image element from the saved blob URL
            const image = new Image();
            image.src = savedImageURL;

            // Wait until the image is fully loaded before sending it to the model
            image.onload = async () => {
                const prediction = await model.predict(image);

                // Display the prediction results
                for (let i = 0; i < maxPredictions; i++) {
                    const classPrediction = `${prediction[i].className}: ${(prediction[i].probability * 100).toFixed(2)}%`;
                    const label = document.createElement("div");
                    label.innerHTML = classPrediction;
                    labelContainer.appendChild(label);
                }

                // Hide loading indicator and re-enable the button
                loadingIndicator.style.display = "none";
                cropBtn.disabled = false;

                // Clean up the blob URL after usage
                URL.revokeObjectURL(savedImageURL);
            };

            // In case image fails to load, handle it
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
