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

    // Attach event listener to the upload button
    document.getElementById('imageUpload').addEventListener('change', function (event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('preview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Attach event listener to the "Identify Image" button
    document.getElementById('identifyBtn').addEventListener('click', predict);
};

// Run prediction on the uploaded image
async function predict() {
    const image = document.getElementById('preview');
    if (!model) {
        alert("Model not loaded yet!");
        return;
    }

    const prediction = await model.predict(image);
    const labelContainer = document.getElementById('label-container');
    labelContainer.innerHTML = "";  // Clear previous results

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = `${prediction[i].className}: ${(prediction[i].probability * 100).toFixed(2)}%`;
        const label = document.createElement("div");
        label.innerHTML = classPrediction;
        labelContainer.appendChild(label);
    }
}
