let model;
const imageElement = document.getElementById('preview');
const resultElement = document.getElementById('result');
const imageUpload = document.getElementById('imageUpload');

async function loadModel() {
    model = await tmImage.load('model.json', 'weights.bin','metadata.json');
    console.log("Model Loaded");
}

imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        imageElement.src = e.target.result;
    };

    reader.readAsDataURL(file);
});

document.getElementById('identifyBtn').addEventListener('click', async () => {
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

window.onload = () => {
    loadModel();
};
