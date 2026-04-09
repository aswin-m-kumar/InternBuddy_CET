# Gunicorn configuration file
# https://docs.gunicorn.org/en/stable/settings.html

import multiprocessing

# Worker configuration
# The LLM calls (via OpenAI SDK to NVIDIA's API) can take longer than the default 30s.
# Especially when returning up to 800 tokens from LLaMA-3.1-70B.
# We increase the timeout to 120 seconds to prevent workers from being killed (SIGKILL) while waiting.
timeout = 120

# Number of workers
# For IO-bound tasks like waiting for external APIs, 
# 2-4 x $(NUM_CORES) is recommended.
workers = 2

# Give workers slightly more time to finish serving requests before being killed during a restart.
graceful_timeout = 30
