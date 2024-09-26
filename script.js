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

    // When a new image is uploaded
    imageUpload.addEventListener('change', function (event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            preview.src = e.target.result;
            if (cropper) {
                cropper.destroy(); // Destroy old cropper instance if exists
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
            const canvas = cropper.getCroppedCanvas({
                width: 224,  // Size for the model input
                height: 224
            });
            const croppedImage = canvas.toDataURL('image/png');
            
            const image = new Image();
            image.src = croppedImage;
            
            // Run the cropped image through the model
            const prediction = await model.predict(image);
            const labelContainer = document.getElementById('label-container');
            labelContainer.innerHTML = "";  // Clear previous results

            for (let i = 0; i < maxPredictions; i++) {
                const classPrediction = `${prediction[i].className}: ${(prediction[i].probability * 100).toFixed(2)}%`;
                const label = document.createElement("div");
                label.innerHTML = classPrediction;
                labelContainer.appendChild(label);
            }
        } else {
            alert("Please upload an image and wait for the model to load.");
        }
    });
};
