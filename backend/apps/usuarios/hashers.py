from django.contrib.auth.hashers import BCryptSHA256PasswordHasher

class BCrypt10PasswordHasher(BCryptSHA256PasswordHasher):
    rounds = 10
