# PythonAnywhere Deployment Guide

This guide describes how to host your backend on **PythonAnywhere** while keeping your SQLite database (`internbuddy.db`) persistent.

## Prerequisites
1. A [PythonAnywhere](https://www.pythonanywhere.com/) account (Free tier is fine).
2. Your GitHub repository URL.

## Step 1: Clone the Repository
1. Log in to PythonAnywhere.
2. Open a **Bash Console**.
3. Run the following commands:
   ```bash
   git clone https://github.com/aswin-m-kumar/InternBuddy_CET.git
   cd InternBuddy_CET
   ```

## Step 2: Set up a Virtual Environment
In the same console, run:
```bash
mkvirtualenv --python=/usr/bin/python3.10 internbuddy-env
pip install -r requirements.txt
pip install python-dotenv
```

## Step 3: Configure the Web App
1. Go to the **Web** tab on the PythonAnywhere dashboard.
2. Click **Add a new web app**.
3. Choose **Manual Configuration** (do NOT choose Flask).
4. Select **Python 3.10**.
5. Under the **Virtualenv** section, enter the path: `/home/YOUR_USERNAME/.virtualenvs/internbuddy-env`.
6. Under the **Code** section, set the **Source code directory** to: `/home/YOUR_USERNAME/InternBuddy_CET`.

## Step 4: Configure the WSGI File
1. In the **Web** tab, click the link to your **WSGI configuration file**.
2. Delete everything in that file and paste this:

```python
import sys
import os
from dotenv import load_dotenv

# Path to your project
path = '/home/YOUR_USERNAME/InternBuddy_CET'
if path not in sys.path:
    sys.path.append(path)

# Load environment variables from .env
load_dotenv(os.path.join(path, '.env'))

from app import app as application
```
*(Replace `YOUR_USERNAME` with your actual PythonAnywhere username)*.

## Step 5: Setup Environment Variables
1. Go back to the **Files** tab and navigate to `InternBuddy_CET`.
2. Create or edit the `.env` file and add:
   ```text
   SECRET_KEY=yoursupersecretkey
   NVIDIA_API_KEY=your_nvidia_api_key_here
   ALLOWED_ORIGINS=https://aswin-m-kumar.github.io
   ```

## Step 6: Reload & Test
1. Go back to the **Web** tab.
2. Click the big green **Reload** button.
3. Your API will be live at `https://YOUR_USERNAME.pythonanywhere.com/`.

> [!IMPORTANT]
> **Check CORS**: Ensure your frontend on GitHub Pages points to the PythonAnywhere URL.
> **Persistence**: Your `internbuddy.db` file will now persist correctly even after reloads!
