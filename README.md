<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:2E86AB,100:A23B72&height=200&section=header&text=Skin%20Lesion%20Analyzer&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=AI-Powered%20Dermatoscopic%20Diagnosis%20%E2%80%94%20Now%20Real-Time&descAlignY=55&descSize=18" width="100%" />

<img src="https://readme-typing-svg.demolab.com/?font=Fira+Code&size=20&pause=1000&color=A23B72&center=true&vCenter=true&width=650&lines=Classifies+7+types+of+skin+lesions;Powered+by+TensorFlow.js+%E2%80%94+runs+in+the+browser;Predicts+in+under+3+seconds%2C+100%25+client-side;Now+with+live+camera+capture+%26+batch+upload" alt="Typing SVG" />

<br/>

![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Keras](https://img.shields.io/badge/Keras-D00000?style=for-the-badge&logo=keras&logoColor=white)

**[🌐 Live Web App](http://skin.test.woza.work/)** &nbsp;·&nbsp; **[📓 Kaggle Kernel](https://www.kaggle.com/vbookshelf/skin-lesion-analyzer-tensorflow-js-web-app)** &nbsp;·&nbsp; **[📄 HAM10000 Paper](https://arxiv.org/abs/1803.10417)**

<br/>

<img src="http://skin.test.woza.work/assets/app_pic.png" width="350" alt="Skin Lesion Analyzer app screenshot" />

</div>

<br/>

> ⚕️ **Medical disclaimer:** this is a screening-support prototype only, not a diagnostic system. All predictions must be reviewed by a qualified medical professional.

<br/>

## 📑 Table of contents

- [What this project does](#-what-this-project-does)
- [🆕 Real-time update — what's new](#-real-time-update--whats-new)
- [Project structure](#-project-structure)
- [Model path configuration](#-model-path-configuration)
- [How to run locally](#-how-to-run-locally)
- [How to deploy your own site](#-how-to-deploy-your-own-site)
- [Bugs & lessons learned](#-bugs--lessons-learned)

<br/>

---

## 🔬 What this project does

A freely available online tool that gives doctors and lab technologists the **top 3 probability diagnoses** for a given skin lesion — helping them quickly flag high-risk patients and speed up triage.

| | |
|---|---|
| ⚡ Speed | Produces a result in **under 3 seconds** |
| 🔒 Privacy | Images are pre-processed and analyzed **entirely in-browser** — never uploaded to a server |
| 🧬 Classes | Classifies **7 types of skin lesions**, per the HAM10000 dataset |
| 🧠 Approach | End-to-end: model creation in Keras → conversion to TensorFlow.js → live web app |

The full model-building and training process — including the Jupyter notebook — is documented in the linked Kaggle kernel. All JavaScript, CSS, HTML, and the trained model itself are open in this repo.

<div align="right"><a href="#-table-of-contents">↑ back to top</a></div>

---

## 🆕 Real-time update — what's new

The original static analyzer has been upgraded into an **interactive real-time screening dashboard**.

<table>
<tr><td>🖱️</td><td>Drag-and-drop JPG/PNG image upload</td></tr>
<tr><td>📚</td><td>Batch image prediction</td></tr>
<tr><td>📷</td><td>Camera capture and analyze</td></tr>
<tr><td>🟢</td><td>Live model loading status</td></tr>
<tr><td>🏆</td><td>Top-3 prediction cards</td></tr>
<tr><td>📊</td><td>Confidence progress bars</td></tr>
<tr><td>🚦</td><td>High / medium / low attention triage card</td></tr>
<tr><td>🗂️</td><td>Local prediction history via browser <code>localStorage</code></td></tr>
<tr><td>⬇️</td><td>Export prediction history as CSV</td></tr>
<tr><td>📈</td><td>Session analytics and confidence trend chart</td></tr>
<tr><td>⚕️</td><td>Medical safety disclaimer built into the UI</td></tr>
</table>

**New files added**
```text
index-realtime.html
css/realtime-skin.css
jscript/realtime-skin-app.js
```

<div align="right"><a href="#-table-of-contents">↑ back to top</a></div>

---

## 🗂 Project structure

```text
project/
├── index.html
├── index-realtime.html          🆕 real-time dashboard
├── faq.html
├── assets/
│   ├── app_pic.png
│   ├── samplepic.jpg
│   └── robotfavicon.png
├── css/
│   ├── skin.css
│   └── realtime-skin.css        🆕
├── jscript/
│   ├── app_startup_code.js
│   ├── app_batch_prediction_code.js
│   ├── target_classes.js
│   └── realtime-skin-app.js     🆕
└── final_model_kaggle_version1/
    └── model.json
```

<div align="right"><a href="#-table-of-contents">↑ back to top</a></div>

---

## ⚙️ Model path configuration

Open `jscript/realtime-skin-app.js` and confirm one of these paths matches your actual TensorFlow.js model folder:

```js
const MODEL_PATHS = [
  "final_model_kaggle_version1/model.json",
  "model_kaggle_version12/model.json",
  "final_model/model.json",
  "model/model.json",
];
```

For the original static version, update the addresses directly in `app_startup_code.js`:

```js
model = await tf.loadModel('http://skin.test.woza.work/model_kaggle_version12/model.json');
$("#selected-image").attr("src", "http://skin.test.woza.work/assets/samplepic.jpg")
```

<div align="right"><a href="#-table-of-contents">↑ back to top</a></div>

---

## 🛠 How to run locally

Browser-based model loading may fail directly from `file:///`, so serve it locally:

```bash
python -m http.server 8000
```

Open the real-time dashboard:
```text
http://127.0.0.1:8000/index-realtime.html
```

Or the original app:
```text
http://127.0.0.1:8000/index.html
```

<div align="right"><a href="#-table-of-contents">↑ back to top</a></div>

---

## 🚀 How to deploy your own site

<details>
<summary><b>Step-by-step deployment guide</b> (click to expand)</summary>

1. **Set up an ISP account** — e.g. [Dreamhost](https://www.dreamhost.com/r.cgi?2163352) or any provider of your choice.
2. **Register a domain**, like `mywebsite.com`. Some ISPs give you the first one free.
3. **Optionally use a sub-domain**, like `skinproject.mywebsite.com` — many ISPs offer these for free, which is handy if you're hosting several personal projects. This project's live demo, `skin.test.woza.work`, is itself a sub-domain of `woza.work`.
4. **Upload these files/folders** to your site (the main HTML file often needs to be named `index.html`, depending on your host):
   - `index.html`
   - `index-realtime.html`
   - `faq.html`
   - `assets/` folder
   - `jscript/` folder
   - `css/` folder
   - `final_model_kaggle_version1/` folder
5. **Update the model paths** in `app_startup_code.js` / `realtime-skin-app.js` to match your domain.
6. Visit your new address in the browser — it should look and behave just like the live demo.

> ⚠️ If you add an HTTPS certificate, it may block the model from auto-downloading for users — test this after enabling SSL.

</details>

<div align="right"><a href="#-table-of-contents">↑ back to top</a></div>

---

## 🐞 Bugs & lessons learned

<details>
<summary><b>Model not loading?</b></summary>
<br>
If uploaded via FileZilla, set the default transfer type to <b>Binary</b> (Settings → Transfers → File Types), then re-upload the model.
</details>

<details>
<summary><b>Testing shows an old model/site version</b></summary>
<br>
Always test in <b>Incognito mode</b> — otherwise your browser may load a cached version instead of the latest.
</details>

<details>
<summary><b>Model works in Keras but breaks after saving/reloading</b></summary>
<br>
Convert the model to TensorFlow.js directly after training, without saving and reloading it first — that intermediate save/load step can break the converted model.
</details>

<details>
<summary><b>Converted tf.keras model won't load or predict</b></summary>
<br>
Use a <b>native Keras model</b> instead — a converted <code>tf.keras</code> model may fail to load, or load but produce no predictions.
</details>

<details>
<summary><b>Accuracy mismatch between training and confusion matrix</b></summary>
<br>
This shows up specifically when not using native Keras — likely related to how <code>predict_generator()</code> behaves (or is being used).
</details>

<details>
<summary><b>Browser compatibility</b></summary>
<br>
The app does not work in OSX Safari. Use the latest version of <b>Chrome</b> — keep browser support in mind for any TensorFlow.js-based app.
</details>

<details>
<summary><b>TIF image format issues</b></summary>
<br>
Browsers don't support TIF. Convert training images to JPG or PNG <i>before</i> training — otherwise app predictions won't match model predictions.
</details>

<details>
<summary><b>PC vs. mobile prediction differences</b></summary>
<br>
Slight probability differences appear between desktop and mobile submissions — likely due to mobile browsers modifying the image before submission.
</details>

<details>
<summary><b>Progress bar reliability (TF.js ≥ 1.0.0)</b></summary>
<br>
Adding a progress bar via <code>onProgress</code> gives a nice visual cue, but can make downloads unreliable on slow connections. Without it, downloads are slower but more reliable. A version with a progress bar is live at <a href="http://apple.test.woza.work/">apple.test.woza.work</a>.
</details>

<div align="right"><a href="#-table-of-contents">↑ back to top</a></div>

---

<div align="center">

> ⚕️ For learning, research, and screening-support demonstration only — not a diagnostic tool. Always consult a qualified medical professional.

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:A23B72,100:2E86AB&height=120&section=footer" width="100%" />

</div>