from pydantic import BaseModel, Field, field_validator

class URLScanRequest(BaseModel):
    url: str = Field(min_length=4, max_length=2048)
    @field_validator("url")
    @classmethod
    def clean_url(cls, value):
        value = value.strip()
        if not value or any(ord(c) < 32 for c in value):
            raise ValueError("Provide a valid non-empty URL")
        return value

class EmailScanRequest(BaseModel):
    email_text: str = Field(min_length=5, max_length=20000)
    @field_validator("email_text")
    @classmethod
    def clean_text(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("Email text cannot be empty")
        return value
