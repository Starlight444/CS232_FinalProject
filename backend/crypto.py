from cryptography.fernet import Fernet
from config import settings

class Crypto:
    def __init__(self):
        self.fernet = Fernet(settings.CRYPTO_SECRET)

    def encrypt(self, text: str) -> str:
        return self.fernet.encrypt(text.encode()).decode()

    def decrypt(self, encrypted_text: str) -> str:
        return self.fernet.decrypt(encrypted_text.encode()).decode()