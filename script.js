let model;
const imageElement = document.getElementById('preview');
const resultElement = document.getElementById('result');
const imageUpload = document.getElementById('imageUpload');
const identifyBtn = document.getElementById('identifyBtn');

// Disable the button initially
identifyBtn.disabled = true;

async function loadModel() {
    try {
        // Load the model (no need to load metadata.json manually)
        model = await tmImage.load('model.json', 'weights.bin');
        console.log("Model Loaded");

        // Enable the button after the model is loaded
        identifyBtn.disabled = false;
    } catch (error) {
        console.error("Error loading model:", error);
    }
}

imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        imageElement.src = e.target.result;
    };

    reader.readAsDataURL(file);
});

identifyBtn.addEventListener('click', async () => {
    if (!model) {
        alert("Model not loaded yet!");
        return;
    }

    const prediction = await model.predict(imageElement);
    let resultText = "Results: \n";

    prediction.forEach(p => {
        resultText += `${p.className}: ${(p.probability * 100).toFixed(2)}%\n`;
    });

    resultElement.textContent = resultText;
});

// Load the model when the page loads
window.onload = () => {
    loadModel();
};
