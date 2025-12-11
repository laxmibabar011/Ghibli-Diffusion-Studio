import torch
from diffusers import StableDiffusionPipeline, StableDiffusionImg2ImgPipeline, LCMScheduler
import os
import time
import random
import threading
from datetime import datetime

# --- CONFIGURATION ---
OUTPUT_FOLDER = "outputs"
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Global Lock for GPU resources
gpu_lock = threading.Lock()

print("[LOG] System Startup: Initializing...")
os.environ['KMP_DUPLICATE_LIB_OK']='True'
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[LOG] Hardware Detected: {device}")

# --- LOAD MODELS (Optimized) ---
model_id = "Lykon/dreamshaper-8"
print(f"[LOG] Loading Brain: {model_id}...")

# 1. Load the Main Pipeline
pipe = StableDiffusionPipeline.from_pretrained(model_id, use_safetensors=True)

# 2. Load LCM Scheduler (The Speed Secret)
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)

try:
    print("[LOG] Loading Ghibli Style & LCM Turbo...")
    # Load LCM LoRA for speed
    pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5", adapter_name="lcm")
    # Load Ghibli LoRA for style
    pipe.load_lora_weights(".", weight_name="ghibli.safetensors", adapter_name="ghibli")
    
    # Combine them
    pipe.set_adapters(["lcm", "ghibli"], adapter_weights=[1.0, 0.8])
    print("[LOG] Turbo & Style Loaded Successfully.")
except Exception as e:
    print(f"[WARNING] LoRA Load Failed: {e}")

pipe.to(device)

# 3. Create Image-to-Image Pipeline (ZERO RAM COST)
img2img_pipe = StableDiffusionImg2ImgPipeline(**pipe.components)
img2img_pipe.to(device)

print(f"[LOG] AI Ready. Saving images to '{OUTPUT_FOLDER}/'")

# --- HELPER FUNCTIONS ---
def get_unique_filename(prefix="art"):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{OUTPUT_FOLDER}/{prefix}_{timestamp}.png"

def enhance_prompt(user_prompt):
    if len(user_prompt) > 100: return user_prompt
    
    style_keywords = [
        "Studio Ghibli style", "anime style", "Hayao Miyazaki vibe", 
        "flat shading", "vibrant colors", "highly detailed", "masterpiece", "8k"
    ]
    lighting_keywords = ["warm lighting", "cinematic lighting", "sunlight", "soft glow"]
    return f"{user_prompt}, {', '.join(style_keywords)}, {random.choice(lighting_keywords)}"

# --- GENERATION FUNCTIONS ---

def generate_image(prompt_text, steps=6, use_magic=True, guidance=1.5):
    with gpu_lock:
        print("\n" + "="*30)
        print(f"[LOG] Text-to-Image Request: '{prompt_text}'")
        
        final_prompt = enhance_prompt(prompt_text) if use_magic else prompt_text
        if "sky" in final_prompt: final_prompt = final_prompt.replace("sky", "(sky:1.2)")
        
        # LCM needs very low guidance (1.0 - 2.0) and few steps (4-8)
        
        start_time = time.time()
        
        image = pipe(
            final_prompt, 
            num_inference_steps=steps,
            guidance_scale=guidance
        ).images[0]
        
        filename = get_unique_filename("ghibli_text")
        image.save(filename)
        
        print(f"[LOG] Done in {round(time.time() - start_time, 2)}s. Saved to: {filename}")
        print("="*30 + "\n")
        return filename

def generate_img2img(prompt_text, init_image, strength=0.55, guidance=1.5):
    with gpu_lock:
        print("\n" + "="*30)
        print(f"[LOG] Image-to-Image Request: '{prompt_text}'")
        
        final_prompt = enhance_prompt(prompt_text)
        
        start_time = time.time()

        image = img2img_pipe(
            prompt=final_prompt,
            image=init_image,
            strength=strength, 
            guidance_scale=guidance,
            num_inference_steps=6
        ).images[0]
        
        filename = get_unique_filename("ghibli_remix")
        image.save(filename)
        
        print(f"[LOG] Remix Done in {round(time.time() - start_time, 2)}s. Saved to: {filename}")
        print("="*30 + "\n")
        return filename