# Use Python 3.10 slim as the base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for potential compilation (e.g., for some python packages)
# and for general utility.
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
# Using --no-cache-dir to keep image size small
RUN pip install --no-cache-dir -r requirements.txt

# Copy the model file from the parent directory context
# Note: The build context must be the root 'ghibli-project' folder
COPY ghibli.safetensors .

# Copy the backend code into the container
COPY backend/ .

# Expose the port the app runs on
EXPOSE 8000

# Create outputs directory
RUN mkdir -p outputs

# Command to run the application
# We use host 0.0.0.0 so it's accessible from outside the container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
