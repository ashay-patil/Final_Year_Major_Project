"""
MediFlow AI - Chest X-Ray AI Diagnosis with Grad-CAM
--------------------------------------------------------
Path: backend/ml/xray_diagnosis.py

Uses a pretrained DenseNet121 from TorchXRayVision (mlmed/torchxrayvision),
trained on ~800k real chest X-rays across NIH/CheXpert/MIMIC/PadChest/RSNA,
to predict 18 pathologies from an uploaded chest X-ray, and generates a
Grad-CAM heatmap showing WHERE in the image the model is looking for its
top prediction.

Model source: https://github.com/mlmed/torchxrayvision
Weights: densenet121-res224-all (auto-downloaded to ~/.torchxrayvision/ on first run)
"""

import io
import base64
import numpy as np
import torch
import torch.nn.functional as F
import torchvision
import torchxrayvision as xrv
import cv2
from PIL import Image

# ---------------------------------------------------------------------
# One-line, patient/exam-friendly descriptions for each of the 18
# pathologies the model can predict. Used to make the frontend output
# readable instead of just raw medical labels.
# ---------------------------------------------------------------------
PATHOLOGY_INFO = {
    "Atelectasis": "Partial collapse of part of the lung.",
    "Consolidation": "Lung tissue filled with fluid/pus instead of air (often infection).",
    "Infiltration": "Substance (fluid/cells) accumulating in lung tissue.",
    "Pneumothorax": "Air trapped between the lung and chest wall (collapsed lung).",
    "Edema": "Fluid buildup in the lungs, often from heart failure.",
    "Emphysema": "Damaged air sacs, common in COPD.",
    "Fibrosis": "Scarring of lung tissue.",
    "Effusion": "Fluid buildup around the lungs (pleural effusion).",
    "Pneumonia": "Infection causing inflammation of the air sacs.",
    "Pleural_Thickening": "Thickening of the lung's lining.",
    "Cardiomegaly": "Enlarged heart.",
    "Nodule": "A small round growth in the lung.",
    "Mass": "A larger abnormal growth in the lung.",
    "Hernia": "Organ displacement through the diaphragm.",
    "Lung Lesion": "An area of abnormal lung tissue.",
    "Fracture": "A broken bone visible in the image (e.g. rib).",
    "Lung Opacity": "An area of the lung that appears denser/whiter than normal.",
    "Enlarged Cardiomediastinum": "Widening of the space around the heart/major vessels.",
}

_MODEL = None
_TARGET_LAYER = None


def get_model():
    """Lazily load the pretrained model once and cache it in memory.
    First call downloads weights from GitHub (needs internet, ~30MB)."""
    global _MODEL, _TARGET_LAYER
    if _MODEL is None:
        print("[XRAY-AI] Loading TorchXRayVision DenseNet121 (densenet121-res224-all)...")
        model = xrv.models.DenseNet(weights="densenet121-res224-all")
        model.eval()
        _MODEL = model
        # Grad-CAM target layer: the last convolutional feature map,
        # i.e. the output of model.features (ends in BatchNorm 'norm5',
        # right before the classifier's ReLU + global-average-pool).
        _TARGET_LAYER = model.features
        print("[XRAY-AI] Model ready. Pathologies:", model.pathologies)
    return _MODEL, _TARGET_LAYER


def _preprocess(image_bytes: bytes):
    """Replicates TorchXRayVision's official preprocessing pipeline."""
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("L")  # grayscale
    img = np.array(pil_img).astype(np.float32)

    img = xrv.datasets.normalize(img, 255)     # scale to [-1024, 1024]
    img = img[None, ...]                       # add channel dim -> [1, H, W]

    transform = torchvision.transforms.Compose([
        xrv.datasets.XRayCenterCrop(),
        xrv.datasets.XRayResizer(224),
    ])
    img = transform(img)
    tensor = torch.from_numpy(img).float().unsqueeze(0)  # [1, 1, 224, 224]

    # Also keep a displayable version of the same 224x224 crop for the
    # heatmap overlay, so the heatmap lines up pixel-for-pixel.
    display_img = ((img[0] - img[0].min()) / (img[0].max() - img[0].min() + 1e-8) * 255).astype(np.uint8)
    return tensor, display_img


def _generate_gradcam(model, target_layer, input_tensor, target_idx):
    """Standard Grad-CAM: hook the target conv layer's activations +
    gradients, backprop the chosen class's raw logit, and combine them
    into a class-discriminative heatmap."""
    activations = {}
    gradients = {}

    def forward_hook(module, inp, out):
        activations["value"] = out.detach()

    def backward_hook(module, grad_in, grad_out):
        gradients["value"] = grad_out[0].detach()

    fh = target_layer.register_forward_hook(forward_hook)
    bh = target_layer.register_full_backward_hook(backward_hook)

    try:
        model.zero_grad()

        # Manually replicate model.forward() up to raw logits, bypassing
        # the op-threshold calibration so Grad-CAM backprops cleanly
        # from a standard classifier logit.
        feats = target_layer(input_tensor)          # triggers forward_hook
        pooled = F.adaptive_avg_pool2d(F.relu(feats), (1, 1)).flatten(1)
        logits = model.classifier(pooled)            # [1, 18]

        score = logits[0, target_idx]
        score.backward()                              # triggers backward_hook

        probs = torch.sigmoid(logits).detach().numpy()[0]

        grads = gradients["value"][0]                 # [C, H, W]
        acts = activations["value"][0]                # [C, H, W]

        weights = grads.mean(dim=(1, 2))               # [C] - global avg pool of gradients
        cam = torch.zeros(acts.shape[1:], dtype=torch.float32)
        for c, w in enumerate(weights):
            cam += w * acts[c]

        cam = F.relu(cam)
        cam = cam - cam.min()
        cam = cam / (cam.max() + 1e-8)
        cam = cam.numpy()
        cam = cv2.resize(cam, (224, 224))
        return cam, probs
    finally:
        fh.remove()
        bh.remove()


def _overlay_heatmap(display_img: np.ndarray, cam: np.ndarray) -> np.ndarray:
    """Blend the Grad-CAM heatmap onto the original (grayscale) X-ray."""
    heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)

    base_rgb = cv2.cvtColor(display_img, cv2.COLOR_GRAY2RGB)
    overlay = cv2.addWeighted(base_rgb, 0.55, heatmap, 0.45, 0)
    return overlay


def _to_base64_png(img_array: np.ndarray) -> str:
    success, buffer = cv2.imencode(".png", cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                                    if img_array.ndim == 3 else img_array)
    if not success:
        raise RuntimeError("Failed to encode image")
    return "data:image/png;base64," + base64.b64encode(buffer).decode("utf-8")


def analyze_chest_xray(image_bytes: bytes, target_pathology: str = None) -> dict:
    """Main entrypoint: run classification + Grad-CAM on an uploaded
    chest X-ray image.

    Args:
        image_bytes: raw bytes of the uploaded image file (jpg/png).
        target_pathology: optional pathology name to generate the
            heatmap for. Defaults to the model's top prediction.

    Returns:
        dict with sorted predictions, the top finding, and base64 PNGs
        of the original (preprocessed) image and the Grad-CAM overlay.
    """
    model, target_layer = get_model()
    input_tensor, display_img = _preprocess(image_bytes)

    pathologies = model.pathologies
    valid_indices = [i for i, p in enumerate(pathologies) if p]  # skip '' placeholders

    # First pass (no grad) just to pick the default target class if none given
    if target_pathology and target_pathology in pathologies:
        target_idx = pathologies.index(target_pathology)
    else:
        with torch.no_grad():
            feats = target_layer(input_tensor)
            pooled = F.adaptive_avg_pool2d(F.relu(feats), (1, 1)).flatten(1)
            logits = model.classifier(pooled)[0]
            masked = logits.clone()
            for i in range(len(pathologies)):
                if i not in valid_indices:
                    masked[i] = -1e9
            target_idx = int(torch.argmax(masked).item())

    cam, probs = _generate_gradcam(model, target_layer, input_tensor, target_idx)
    overlay = _overlay_heatmap(display_img, cam)

    predictions = []
    for i in valid_indices:
        predictions.append({
            "pathology": pathologies[i],
            "probability": round(float(probs[i]), 4),
            "description": PATHOLOGY_INFO.get(pathologies[i], ""),
        })
    predictions.sort(key=lambda p: p["probability"], reverse=True)

    return {
        "predictions": predictions,
        "top_finding": predictions[0],
        "heatmap_target": pathologies[target_idx],
        "heatmap_target_probability": round(float(probs[target_idx]), 4),
        "original_image_base64": _to_base64_png(cv2.cvtColor(display_img, cv2.COLOR_GRAY2RGB)),
        "heatmap_image_base64": _to_base64_png(overlay),
        "model_info": {
            "architecture": "DenseNet121",
            "weights": "densenet121-res224-all",
            "source": "TorchXRayVision (github.com/mlmed/torchxrayvision)",
            "trained_on": "NIH ChestX-ray14, CheXpert, MIMIC-CXR, PadChest, Google, OpenI, RSNA",
        },
        "disclaimer": "Research/educational demo only — NOT a certified diagnostic tool.",
    }