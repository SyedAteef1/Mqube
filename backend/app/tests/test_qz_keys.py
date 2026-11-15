"""Each install creates its own QZ print-signing key; the key file is private to the server."""
import base64, importlib, os, stat
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding


def test_new_install_creates_private_key_and_signs(tmp_path, monkeypatch):
    monkeypatch.setenv("QZ_CERTS_DIR", str(tmp_path / "certs"))
    import app.services.qz_security as qz
    qz = importlib.reload(qz)
    cert_pem = qz.QzSecurityService.get_public_certificate()
    key_file = tmp_path / "certs" / "qz_private_key.pem"
    assert key_file.exists()
    assert stat.S_IMODE(os.stat(key_file).st_mode) == 0o600
    sig = base64.b64decode(qz.QzSecurityService.sign_request("print-job-123"))
    pub = x509.load_pem_x509_certificate(cert_pem.encode()).public_key()
    pub.verify(sig, b"print-job-123", padding.PKCS1v15(), hashes.SHA512())  # raises if wrong
    monkeypatch.delenv("QZ_CERTS_DIR")
    importlib.reload(qz)
