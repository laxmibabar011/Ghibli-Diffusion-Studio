import requests

# The direct link to the Ghibli file
url = "https://huggingface.co/artificialguybr/studioghibli-redmond-1-5v-studio-ghibli-lora-for-liberteredmond-sd-1-5/resolve/main/StudioGhibliRedmond-15V-LiberteRedmond-StdGBRedmAF-StudioGhibli.safetensors"

print("--> Downloading Ghibli Style file... (38MB)")
response = requests.get(url)

# Save it as the simple name we need
with open("ghibli.safetensors", "wb") as f:
    f.write(response.content)

print("--> Download Complete! You can now run generate.py")