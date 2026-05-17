"""
Modal.com deployment for xmobile MediaPipe try-on POC.

Setup (kullanıcı yapacak):
  1. https://modal.com — kayıt ol (mail + GitHub)
  2. CLI kur:
       pip install modal
       modal token new      # tarayıcı açar, hesabı authorize et
  3. Bu dosyayı deploy et:
       modal deploy modal_deploy.py
  4. Çıktıdaki HTTPS URL'i xmobile-proxy env'e yaz:
       COMPOSITE_TRYON_URL=https://<workspace>--xmobile-tryon-...
"""
import modal

app = modal.App("xmobile-tryon")

# Container image: Python 3.12 + tüm bağımlılıklar + repo kodu
image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "mediapipe==0.10.21",
        "opencv-python-headless>=4.10.0",
        "pillow>=10.0.0",
        "numpy<2",
        "fastapi>=0.115.0",
        "uvicorn[standard]>=0.32.0",
        "python-multipart>=0.0.12",
    )
    # MediaPipe model dosyalarını ilk request'te indirir, cache eder
    .add_local_python_source("shoe_overlay", "accessory_overlay", "server")
)


@app.function(
    image=image,
    cpu=2,
    memory=2048,
    timeout=60,
    max_containers=10,
    # GPU şart değil — MediaPipe CPU'da 3-5 sn yeter; future: gpu="t4" ile hızlandır
)
@modal.asgi_app()
def fastapi_app():
    from server import app as fastapi_app
    return fastapi_app
