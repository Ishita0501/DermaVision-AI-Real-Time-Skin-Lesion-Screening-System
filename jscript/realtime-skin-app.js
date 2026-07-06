const CLASS_INFO = {
  akiec: {
    name: "Actinic Keratoses / Bowen's disease",
    note: "Potential precursor/non-invasive squamous cell carcinoma group. Needs medical review if suspected.",
    attention: "high",
  },
  bcc: {
    name: "Basal Cell Carcinoma",
    note: "Common skin cancer type. Usually slow growing but should be clinically evaluated.",
    attention: "high",
  },
  bkl: {
    name: "Benign Keratosis-like Lesion",
    note: "Benign keratosis group; may still mimic melanoma visually.",
    attention: "medium",
  },
  df: {
    name: "Dermatofibroma",
    note: "Usually benign skin lesion.",
    attention: "low",
  },
  mel: {
    name: "Melanoma",
    note: "High-priority malignant lesion class. Immediate dermatologist/pathologist review is recommended.",
    attention: "high",
  },
  nv: {
    name: "Melanocytic Nevus",
    note: "Usually benign mole/nevus class.",
    attention: "low",
  },
  vasc: {
    name: "Vascular Lesion",
    note: "Includes vascular skin lesions such as angiomas and related conditions.",
    attention: "low",
  },
};

// Keep this order exactly aligned with your trained model output classes.
const CLASS_ORDER = ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc"];

// Add/adjust paths depending on your project folder name.
const MODEL_PATHS = [
  "final_model_kaggle_version1/model.json",
  "model_kaggle_version12/model.json",
  "final_model/model.json",
  "model/model.json",
];

let model = null;
let selectedFiles = [];
let cameraStream = null;
let history = JSON.parse(localStorage.getItem("skinLesionRealtimeHistory") || "[]");

const $ = (id) => document.getElementById(id);

function setModelStatus(online, title, subtitle) {
  $("modelDot").className = `dot ${online ? "online" : "offline"}`;
  $("modelStatus").textContent = title;
  $("modelSubStatus").textContent = subtitle || "";
}

function showRiskCard(level, title, message) {
  const card = $("riskCard");
  card.className = `risk-card ${level}`;
  card.innerHTML = `<span>${level.toUpperCase()} ATTENTION</span><strong>${title}</strong><p>${message}</p>`;
}

async function loadModel() {
  setModelStatus(false, "Loading model...", "Trying available model paths");

  for (const path of MODEL_PATHS) {
    try {
      model = await tf.loadLayersModel(path, {
        onProgress: (fraction) => {
          const pct = Math.round(fraction * 100);
          setModelStatus(false, `Loading model ${pct}%`, path);
        },
      });

      setModelStatus(true, "Model ready", path);
      return;
    } catch (error) {
      console.warn(`Model path failed: ${path}`, error.message);
    }
  }

  setModelStatus(false, "Model not found", "Check your model.json folder path in realtime-skin-app.js");
  showRiskCard(
    "medium",
    "Model loading failed",
    "Update MODEL_PATHS inside jscript/realtime-skin-app.js to match your TensorFlow.js model folder."
  );
}

function setupDropZone() {
  const dropZone = $("dropZone");
  const input = $("imageInput");

  dropZone.addEventListener("click", () => input.click());

  input.addEventListener("change", () => {
    selectedFiles = Array.from(input.files || []);
    previewFirstFile();
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove("dragover");
    });
  });

  dropZone.addEventListener("drop", (event) => {
    selectedFiles = Array.from(event.dataTransfer.files || []).filter((file) =>
      ["image/jpeg", "image/jpg", "image/png"].includes(file.type)
    );
    previewFirstFile();
  });
}

function previewFirstFile() {
  if (!selectedFiles.length) return;
  const imageUrl = URL.createObjectURL(selectedFiles[0]);
  $("selectedImage").src = imageUrl;
}

async function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function imageToTensor(image) {
  const canvas = $("hiddenCanvas");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, 224, 224);

  return tf.tidy(() => {
    const tensor = tf.browser.fromPixels(canvas)
      .toFloat()
      .expandDims(0);

    // MobileNet preprocess style: scale RGB from [0,255] to [-1,1]
    return tensor.div(127.5).sub(1);
  });
}

async function predictImage(image, sourceName = "camera-capture") {
  if (!model) {
    throw new Error("Model is not loaded yet.");
  }

  const start = performance.now();
  const tensor = imageToTensor(image);
  const prediction = model.predict(tensor);
  const scores = await prediction.data();

  tensor.dispose();
  prediction.dispose();

  const latency = Math.round(performance.now() - start);
  $("latencyBadge").textContent = `${latency} ms`;

  const results = Array.from(scores)
    .map((score, index) => ({
      label: CLASS_ORDER[index],
      score: Number(score),
      ...CLASS_INFO[CLASS_ORDER[index]],
    }))
    .sort((a, b) => b.score - a.score);

  renderResults(results, latency);
  savePrediction(results, latency, sourceName);
  return results;
}

function renderResults(results, latency) {
  const top = results[0];
  const topPercent = Math.round(top.score * 100);

  let level = "low";
  let title = "Low attention screening result";
  let message = "The top prediction is not from the highest-attention classes. Still consult a clinician if symptoms or visual changes exist.";

  if (top.attention === "high" && top.score >= 0.35) {
    level = "high";
    title = "High attention screening result";
    message = "The top prediction belongs to a clinically important class. Dermatologist/pathologist review is strongly recommended.";
  } else if (top.attention === "medium" || top.score < 0.55) {
    level = "medium";
    title = "Needs careful review";
    message = "Confidence is moderate or the lesion can be visually confusing. Professional review is recommended.";
  }

  showRiskCard(level, `${top.label.toUpperCase()} • ${top.name} • ${topPercent}%`, message);

  $("resultList").innerHTML = results.slice(0, 3).map((item, index) => {
    const pct = Math.round(item.score * 100);
    return `
      <div class="result-item">
        <div class="result-head">
          <span>#${index + 1} ${item.label.toUpperCase()} — ${item.name}</span>
          <span>${pct}%</span>
        </div>
        <div class="bar"><span style="width:${pct}%"></span></div>
        <p>${item.note}</p>
      </div>
    `;
  }).join("");
}

async function analyzeSelectedFiles() {
  if (!selectedFiles.length) {
    alert("Please select or drop at least one JPG/PNG image.");
    return;
  }

  $("analyzeBtn").disabled = true;
  $("analyzeBtn").textContent = "Analyzing...";

  try {
    for (const file of selectedFiles) {
      const image = await fileToImage(file);
      $("selectedImage").src = image.src;
      await predictImage(image, file.name);
    }

    renderHistory();
  } catch (error) {
    showRiskCard("medium", "Prediction failed", error.message);
  } finally {
    $("analyzeBtn").disabled = false;
    $("analyzeBtn").textContent = "Analyze Selected Images";
  }
}

function savePrediction(results, latency, sourceName) {
  const top = results[0];

  history.unshift({
    id: Date.now(),
    time: new Date().toISOString(),
    source: sourceName,
    label: top.label,
    name: top.name,
    confidence: top.score,
    attention: top.attention,
    latency,
    top3: results.slice(0, 3).map((r) => ({
      label: r.label,
      name: r.name,
      confidence: r.score,
    })),
  });

  history = history.slice(0, 100);
  localStorage.setItem("skinLesionRealtimeHistory", JSON.stringify(history));
  renderStats();
  drawTrendChart();
}

function renderHistory() {
  const grid = $("historyGrid");

  if (!history.length) {
    grid.innerHTML = `<div class="history-card"><h4>No history yet</h4><p>Predictions will appear here after analysis.</p></div>`;
    renderStats();
    drawTrendChart();
    return;
  }

  grid.innerHTML = history.map((item) => {
    const pct = Math.round(item.confidence * 100);
    const time = new Date(item.time).toLocaleString();

    return `
      <div class="history-card">
        <h4>${item.label.toUpperCase()} — ${pct}%</h4>
        <p><b>${item.name}</b></p>
        <p>Attention: ${item.attention}</p>
        <p>Latency: ${item.latency} ms</p>
        <p>Source: ${item.source}</p>
        <p>${time}</p>
      </div>
    `;
  }).join("");

  renderStats();
  drawTrendChart();
}

function renderStats() {
  const total = history.length;
  const high = history.filter((item) => item.attention === "high").length;
  const avg = total
    ? Math.round((history.reduce((sum, item) => sum + Number(item.confidence || 0), 0) / total) * 100)
    : 0;

  $("totalScans").textContent = total;
  $("highRiskScans").textContent = high;
  $("avgConfidence").textContent = `${avg}%`;
}

function drawTrendChart() {
  const canvas = $("trendCanvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = 20 + i * 52;
    ctx.beginPath();
    ctx.moveTo(45, y);
    ctx.lineTo(w - 20, y);
    ctx.stroke();
  }

  const points = [...history].reverse().slice(-20).map((item) => Number(item.confidence || 0));

  if (!points.length) {
    ctx.fillStyle = "#64748b";
    ctx.font = "16px Arial";
    ctx.fillText("No confidence trend yet.", 58, 135);
    return;
  }

  const left = 45;
  const right = w - 20;
  const top = 20;
  const bottom = h - 28;
  const step = points.length === 1 ? 0 : (right - left) / (points.length - 1);

  ctx.strokeStyle = "#0891b2";
  ctx.lineWidth = 3;
  ctx.beginPath();

  points.forEach((value, index) => {
    const x = left + index * step;
    const y = bottom - value * (bottom - top);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  points.forEach((value, index) => {
    const x = left + index * step;
    const y = bottom - value * (bottom - top);
    ctx.beginPath();
    ctx.fillStyle = value >= 0.7 ? "#dc2626" : value >= 0.45 ? "#f59e0b" : "#16a34a";
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });

    $("cameraVideo").srcObject = cameraStream;
  } catch (error) {
    alert(`Camera access failed: ${error.message}`);
  }
}

function stopCamera() {
  if (!cameraStream) return;

  cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  $("cameraVideo").srcObject = null;
}

async function captureAndAnalyze() {
  const video = $("cameraVideo");

  if (!video.srcObject) {
    alert("Start camera first.");
    return;
  }

  const canvas = $("hiddenCanvas");
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, 224, 224);

  const image = new Image();
  image.onload = async () => {
    $("selectedImage").src = image.src;
    await predictImage(image, "camera-capture");
    renderHistory();
  };
  image.src = canvas.toDataURL("image/png");
}

function exportHistoryCSV() {
  if (!history.length) {
    alert("No history available to export.");
    return;
  }

  const headers = ["time", "source", "label", "name", "confidence", "attention", "latency"];
  const rows = history.map((item) =>
    headers.map((key) => `"${String(item[key] ?? "").replaceAll('"', '""')}"`).join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `skin_lesion_predictions_${Date.now()}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

function clearHistory() {
  if (!confirm("Clear local prediction history?")) return;
  history = [];
  localStorage.removeItem("skinLesionRealtimeHistory");
  renderHistory();
}

function resetDashboard() {
  selectedFiles = [];
  $("resultList").innerHTML = "";
  $("latencyBadge").textContent = "0 ms";
  showRiskCard("neutral", "No prediction yet", "Upload an image or use the camera to start analysis.");
}

function renderClassGuide() {
  $("classGuide").innerHTML = CLASS_ORDER.map((label) => {
    const info = CLASS_INFO[label];
    return `
      <div class="class-card">
        <h4>${label.toUpperCase()} — ${info.name}</h4>
        <p>${info.note}</p>
        <p>Attention level: <b>${info.attention}</b></p>
      </div>
    `;
  }).join("");
}

async function init() {
  setupDropZone();
  renderClassGuide();
  renderHistory();
  await loadModel();
}

init();
